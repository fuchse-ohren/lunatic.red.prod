/**
 * 3D Font Engine - TTF/OTF/WOFF to Three.js Typeface JSON converter
 * Standalone library, no external dependencies (except THREE for createTextShapes).
 * 
 * Supported formats:
 *   - TrueType (.ttf) 
 *   - OpenType/CFF (.otf)
 *   - CFF2 variable fonts (default instance)
 *   - WOFF (.woff) with built-in inflate decompressor
 *   - WOFF2 (.woff2) detection with helpful error
 *
 * Features:
 *   - Full CFF Type2 CharString interpreter (shared stack, subroutines, transient array)
 *   - CID-keyed font support (FDSelect, per-FD Private DICTs)
 *   - Kerning from GPOS pair positioning and legacy kern table
 *   - cmap formats 0, 4, 6, 12
 *   - Custom Shape builder for Three.js (bypasses TextGeometry winding bug)
 *
 * Usage:
 *   // Parse font → JSON
 *   const json = FontEngine3D.parse(arrayBuffer);
 *
 *   // Build Three.js shapes (recommended over TextGeometry)
 *   const shapes = FontEngine3D.createTextShapes(THREE, json, 'Hello', {
 *       size: 80, curveSegments: 48
 *   });
 *   const geometry = new THREE.ExtrudeGeometry(shapes, { depth: 15, curveSegments: 48 });
 *
 *   // Debug: generate SVG
 *   const svg = FontEngine3D.generateSVG(json, 'Test', 120);
 */

var FontEngine3D = (() => {

    // =========================================================================
    // DataReader - Binary data reading utility (Big Endian)
    // =========================================================================
    class DataReader {
        constructor(buffer, offset = 0) {
            this.data = new DataView(buffer instanceof ArrayBuffer ? buffer : buffer.buffer);
            this.offset = offset;
            this.length = this.data.byteLength;
        }

        seek(offset) { this.offset = offset; return this; }
        skip(n) { this.offset += n; return this; }
        tell() { return this.offset; }

        readUint8() { const v = this.data.getUint8(this.offset); this.offset += 1; return v; }
        readInt8() { const v = this.data.getInt8(this.offset); this.offset += 1; return v; }
        readUint16() { const v = this.data.getUint16(this.offset, false); this.offset += 2; return v; }
        readInt16() { const v = this.data.getInt16(this.offset, false); this.offset += 2; return v; }
        readUint32() { const v = this.data.getUint32(this.offset, false); this.offset += 4; return v; }
        readInt32() { const v = this.data.getInt32(this.offset, false); this.offset += 4; return v; }

        readFixed() {
            const v = this.data.getInt32(this.offset, false);
            this.offset += 4;
            return v / 65536;
        }

        readF2Dot14() {
            const v = this.data.getInt16(this.offset, false);
            this.offset += 2;
            return v / 16384;
        }

        readTag() {
            let s = '';
            for (let i = 0; i < 4; i++) s += String.fromCharCode(this.readUint8());
            return s;
        }

        readBytes(n) {
            const arr = new Uint8Array(this.data.buffer, this.offset, n);
            this.offset += n;
            return arr;
        }

        // Read a string of given length and encoding
        readString(length, encoding = 'ascii') {
            const bytes = this.readBytes(length);
            if (encoding === 'utf16be') {
                let s = '';
                for (let i = 0; i < bytes.length; i += 2) {
                    s += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
                }
                return s;
            }
            return Array.from(bytes).map(b => String.fromCharCode(b)).join('');
        }
    }

    // =========================================================================
    // WOFF / WOFF2 Container Support
    // =========================================================================

    // Minimal inflate (RFC 1951) decoder for WOFF decompression
    function inflate(src) {
        const bits = { data: src, pos: 0, byte: 0, bit: 0 };
        function readBit() {
            if (bits.bit === 0) { bits.byte = src[bits.pos++]; bits.bit = 8; }
            const b = bits.byte & 1; bits.byte >>= 1; bits.bit--; return b;
        }
        function readBits(n) {
            let v = 0;
            for (let i = 0; i < n; i++) v |= readBit() << i;
            return v;
        }
        function readHuffSym(tree) {
            let node = tree;
            while (Array.isArray(node)) node = node[readBit()];
            return node;
        }
        function buildTree(lengths) {
            const maxLen = Math.max(...lengths.filter(l => l > 0));
            const blCount = new Array(maxLen + 1).fill(0);
            for (const l of lengths) if (l > 0) blCount[l]++;
            const nextCode = new Array(maxLen + 1).fill(0);
            let code = 0;
            for (let i = 1; i <= maxLen; i++) {
                code = (code + blCount[i - 1]) << 1;
                nextCode[i] = code;
            }
            const tree = [null, null];
            for (let i = 0; i < lengths.length; i++) {
                const len = lengths[i];
                if (len === 0) continue;
                let node = tree;
                const c = nextCode[len]++;
                for (let j = len - 1; j >= 0; j--) {
                    const bit = (c >> j) & 1;
                    if (j === 0) { node[bit] = i; }
                    else {
                        if (!Array.isArray(node[bit])) node[bit] = [null, null];
                        node = node[bit];
                    }
                }
            }
            return tree;
        }

        // Fixed Huffman trees
        const fixedLitLen = new Array(288);
        for (let i = 0; i <= 143; i++) fixedLitLen[i] = 8;
        for (let i = 144; i <= 255; i++) fixedLitLen[i] = 9;
        for (let i = 256; i <= 279; i++) fixedLitLen[i] = 7;
        for (let i = 280; i <= 287; i++) fixedLitLen[i] = 8;
        const fixedDist = new Array(32).fill(5);
        const fixedLitTree = buildTree(fixedLitLen);
        const fixedDistTree = buildTree(fixedDist);

        const lenBase = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
        const lenExtra = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
        const distBase = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
        const distExtra = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
        const codeLenOrder = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];

        const out = [];
        let bfinal = 0;
        while (!bfinal) {
            bfinal = readBit();
            const btype = readBits(2);

            if (btype === 0) {
                // Stored
                bits.bit = 0;
                const len = src[bits.pos] | (src[bits.pos + 1] << 8); bits.pos += 4;
                for (let i = 0; i < len; i++) out.push(src[bits.pos++]);
            } else {
                let litTree, distTree;
                if (btype === 1) {
                    litTree = fixedLitTree; distTree = fixedDistTree;
                } else {
                    const hlit = readBits(5) + 257;
                    const hdist = readBits(5) + 1;
                    const hclen = readBits(4) + 4;
                    const codeLenLens = new Array(19).fill(0);
                    for (let i = 0; i < hclen; i++) codeLenLens[codeLenOrder[i]] = readBits(3);
                    const codeLenTree = buildTree(codeLenLens);
                    const allLens = [];
                    while (allLens.length < hlit + hdist) {
                        const sym = readHuffSym(codeLenTree);
                        if (sym < 16) { allLens.push(sym); }
                        else if (sym === 16) { const r = readBits(2) + 3; for (let j = 0; j < r; j++) allLens.push(allLens[allLens.length - 1]); }
                        else if (sym === 17) { const r = readBits(3) + 3; for (let j = 0; j < r; j++) allLens.push(0); }
                        else { const r = readBits(7) + 11; for (let j = 0; j < r; j++) allLens.push(0); }
                    }
                    litTree = buildTree(allLens.slice(0, hlit));
                    distTree = buildTree(allLens.slice(hlit));
                }

                while (true) {
                    const sym = readHuffSym(litTree);
                    if (sym === 256) break;
                    if (sym < 256) { out.push(sym); }
                    else {
                        const li = sym - 257;
                        const len = lenBase[li] + readBits(lenExtra[li]);
                        const di = readHuffSym(distTree);
                        const dist = distBase[di] + readBits(distExtra[di]);
                        for (let j = 0; j < len; j++) out.push(out[out.length - dist]);
                    }
                }
            }
        }
        return new Uint8Array(out);
    }

    function unwrapWOFF(buffer) {
        const view = new DataView(buffer);
        const signature = view.getUint32(0);
        if (signature !== 0x774F4646) return null; // 'wOFF'

        const flavor = view.getUint32(4);
        const totalSfntSize = view.getUint32(16);
        const numTables = view.getUint16(12);

        // Build SFNT output
        const sfnt = new Uint8Array(totalSfntSize);
        const sfntView = new DataView(sfnt.buffer);

        // Write SFNT header
        sfntView.setUint32(0, flavor);
        sfntView.setUint16(4, numTables);
        // Calculate searchRange, entrySelector, rangeShift
        let sr = 1, es = 0;
        while (sr * 2 <= numTables) { sr *= 2; es++; }
        sr *= 16;
        sfntView.setUint16(6, sr);
        sfntView.setUint16(8, es);
        sfntView.setUint16(10, numTables * 16 - sr);

        let dirOffset = 12;
        let dataOffset = 12 + numTables * 16;
        let woffOffset = 44; // WOFF table directory starts at byte 44

        for (let i = 0; i < numTables; i++) {
            const tag = view.getUint32(woffOffset);
            const woffOff = view.getUint32(woffOffset + 4);
            const compLength = view.getUint32(woffOffset + 8);
            const origLength = view.getUint32(woffOffset + 12);
            const origChecksum = view.getUint32(woffOffset + 16);
            woffOffset += 20;

            // Write table directory entry
            sfntView.setUint32(dirOffset, tag);
            sfntView.setUint32(dirOffset + 4, origChecksum);
            sfntView.setUint32(dirOffset + 8, dataOffset);
            sfntView.setUint32(dirOffset + 12, origLength);
            dirOffset += 16;

            // Decompress or copy table data
            const compData = new Uint8Array(buffer, woffOff, compLength);
            if (compLength < origLength) {
                // Compressed with zlib: skip 2-byte zlib header, inflate raw deflate
                const rawDeflate = compData.subarray(2);
                const decompressed = inflate(rawDeflate);
                sfnt.set(decompressed.subarray(0, origLength), dataOffset);
            } else {
                sfnt.set(compData, dataOffset);
            }

            // Align to 4-byte boundary
            dataOffset += origLength;
            while (dataOffset % 4 !== 0) dataOffset++;
        }

        return sfnt.buffer;
    }

    function unwrapWOFF2(buffer) {
        const view = new DataView(buffer);
        const signature = view.getUint32(0);
        if (signature !== 0x774F4632) return null; // 'wOF2'
        throw new Error(
            'WOFF2 format detected. WOFF2 requires Brotli decompression which is not included. ' +
            'Please convert to .ttf/.otf/.woff first using tools like:\n' +
            '  - https://transfonter.org/\n' +
            '  - woff2_decompress command line tool'
        );
    }

    function detectAndUnwrap(buffer) {
        if (buffer.byteLength < 4) throw new Error('File too small to be a font');
        const sig = new DataView(buffer).getUint32(0);
        if (sig === 0x774F4646) return unwrapWOFF(buffer);   // WOFF
        if (sig === 0x774F4632) return unwrapWOFF2(buffer);   // WOFF2
        return buffer; // Already SFNT (TTF/OTF)
    }

    // =========================================================================
    // Table Directory Parser
    // =========================================================================
    function parseTableDirectory(reader) {
        reader.seek(0);
        const sfVersion = reader.readTag();
        const numTables = reader.readUint16();
        reader.skip(6); // searchRange, entrySelector, rangeShift

        const tables = {};
        for (let i = 0; i < numTables; i++) {
            const tag = reader.readTag();
            const checksum = reader.readUint32();
            const offset = reader.readUint32();
            const length = reader.readUint32();
            tables[tag] = { offset, length, checksum };
        }
        return { sfVersion, tables };
    }

    // =========================================================================
    // 'head' table
    // =========================================================================
    function parseHead(reader, table) {
        reader.seek(table.offset);
        const majorVersion = reader.readUint16();
        const minorVersion = reader.readUint16();
        const fontRevision = reader.readFixed();
        reader.skip(4); // checksumAdjustment
        reader.skip(4); // magicNumber
        const flags = reader.readUint16();
        const unitsPerEm = reader.readUint16();
        reader.skip(16); // created, modified
        const xMin = reader.readInt16();
        const yMin = reader.readInt16();
        const xMax = reader.readInt16();
        const yMax = reader.readInt16();
        const macStyle = reader.readUint16();
        const lowestRecPPEM = reader.readUint16();
        reader.skip(2); // fontDirectionHint
        const indexToLocFormat = reader.readInt16();
        return { unitsPerEm, xMin, yMin, xMax, yMax, indexToLocFormat, flags };
    }

    // =========================================================================
    // 'maxp' table
    // =========================================================================
    function parseMaxp(reader, table) {
        reader.seek(table.offset);
        const version = reader.readFixed();
        const numGlyphs = reader.readUint16();
        return { version, numGlyphs };
    }

    // =========================================================================
    // 'hhea' table
    // =========================================================================
    function parseHhea(reader, table) {
        reader.seek(table.offset);
        reader.skip(4); // version
        const ascender = reader.readInt16();
        const descender = reader.readInt16();
        const lineGap = reader.readInt16();
        const advanceWidthMax = reader.readUint16();
        reader.skip(22); // various fields
        const numberOfHMetrics = reader.readUint16();
        return { ascender, descender, lineGap, advanceWidthMax, numberOfHMetrics };
    }

    // =========================================================================
    // 'hmtx' table
    // =========================================================================
    function parseHmtx(reader, table, numberOfHMetrics, numGlyphs) {
        reader.seek(table.offset);
        const metrics = [];
        let lastAdvanceWidth = 0;
        for (let i = 0; i < numberOfHMetrics; i++) {
            const advanceWidth = reader.readUint16();
            const lsb = reader.readInt16();
            metrics.push({ advanceWidth, lsb });
            lastAdvanceWidth = advanceWidth;
        }
        // Remaining glyphs share the last advanceWidth
        for (let i = numberOfHMetrics; i < numGlyphs; i++) {
            const lsb = reader.readInt16();
            metrics.push({ advanceWidth: lastAdvanceWidth, lsb });
        }
        return metrics;
    }

    // =========================================================================
    // 'name' table
    // =========================================================================
    function parseName(reader, table) {
        reader.seek(table.offset);
        const format = reader.readUint16();
        const count = reader.readUint16();
        const stringOffset = reader.readUint16();
        const storageBase = table.offset + stringOffset;

        const names = {};
        for (let i = 0; i < count; i++) {
            const platformID = reader.readUint16();
            const encodingID = reader.readUint16();
            const languageID = reader.readUint16();
            const nameID = reader.readUint16();
            const length = reader.readUint16();
            const offset = reader.readUint16();

            const savedOffset = reader.tell();
            reader.seek(storageBase + offset);

            let str;
            if (platformID === 3 || platformID === 0) {
                str = reader.readString(length, 'utf16be');
            } else {
                str = reader.readString(length, 'ascii');
            }
            reader.seek(savedOffset);

            // Prefer platformID 3 (Windows) or first encountered
            if (!names[nameID] || platformID === 3) {
                names[nameID] = str;
            }
        }
        return {
            copyright: names[0] || '',
            fontFamily: names[1] || '',
            fontSubfamily: names[2] || '',
            uniqueID: names[3] || '',
            fullName: names[4] || '',
            version: names[5] || '',
            postScriptName: names[6] || '',
            designer: names[9] || '',
            license: names[13] || ''
        };
    }

    // =========================================================================
    // 'OS/2' table
    // =========================================================================
    function parseOS2(reader, table) {
        if (!table) return null;
        reader.seek(table.offset);
        const version = reader.readUint16();
        reader.skip(2); // xAvgCharWidth
        const usWeightClass = reader.readUint16();
        reader.skip(2); // usWidthClass
        reader.skip(2); // fsType
        reader.skip(16); // ySubscript* (4 fields) + ySuperscript* (4 fields)
        reader.skip(4); // yStrikeoutSize + yStrikeoutPosition
        reader.skip(2); // sFamilyClass
        reader.skip(10); // panose
        reader.skip(16); // ulUnicode
        reader.skip(4); // achVendID
        const fsSelection = reader.readUint16();
        reader.skip(4); // usFirst/LastCharIndex
        const sTypoAscender = reader.readInt16();
        const sTypoDescender = reader.readInt16();
        const sTypoLineGap = reader.readInt16();
        const usWinAscent = reader.readUint16();
        const usWinDescent = reader.readUint16();

        return { version, usWeightClass, fsSelection, sTypoAscender, sTypoDescender, sTypoLineGap, usWinAscent, usWinDescent };
    }

    // =========================================================================
    // 'post' table
    // =========================================================================
    function parsePost(reader, table) {
        reader.seek(table.offset);
        const format = reader.readFixed();
        const italicAngle = reader.readFixed();
        const underlinePosition = reader.readInt16();
        const underlineThickness = reader.readInt16();
        const isFixedPitch = reader.readUint32();
        return { format, italicAngle, underlinePosition, underlineThickness, isFixedPitch };
    }

    // =========================================================================
    // 'cmap' table - Character to Glyph mapping
    // =========================================================================
    function parseCmap(reader, table) {
        reader.seek(table.offset);
        const version = reader.readUint16();
        const numSubtables = reader.readUint16();

        // Find best subtable: prefer format 12 (full Unicode), then format 4 (BMP)
        let bestSubtable = null;
        let bestPriority = -1;

        for (let i = 0; i < numSubtables; i++) {
            const platformID = reader.readUint16();
            const encodingID = reader.readUint16();
            const offset = reader.readUint32();

            let priority = 0;
            // Windows Unicode full (format 12 likely)
            if (platformID === 3 && encodingID === 10) priority = 6;
            // Unicode full
            else if (platformID === 0 && encodingID === 4) priority = 5;
            // Windows Unicode BMP (format 4 likely)
            else if (platformID === 3 && encodingID === 1) priority = 4;
            // Unicode BMP
            else if (platformID === 0 && (encodingID === 3 || encodingID === 1 || encodingID === 0)) priority = 3;

            if (priority > bestPriority) {
                bestPriority = priority;
                bestSubtable = { platformID, encodingID, offset: table.offset + offset };
            }
        }

        if (!bestSubtable) throw new Error('No suitable cmap subtable found');

        reader.seek(bestSubtable.offset);
        const format = reader.readUint16();

        if (format === 4) return parseCmapFormat4(reader, bestSubtable.offset);
        if (format === 12) return parseCmapFormat12(reader, bestSubtable.offset);
        if (format === 6) return parseCmapFormat6(reader, bestSubtable.offset);
        if (format === 0) return parseCmapFormat0(reader, bestSubtable.offset);

        throw new Error(`Unsupported cmap format: ${format}`);
    }

    function parseCmapFormat4(reader, tableOffset) {
        reader.seek(tableOffset);
        reader.skip(2); // format (already read, re-read for consistency)
        const length = reader.readUint16();
        reader.skip(2); // language
        const segCount = reader.readUint16() >> 1;
        reader.skip(6); // searchRange, entrySelector, rangeShift

        const endCodes = [];
        for (let i = 0; i < segCount; i++) endCodes.push(reader.readUint16());
        reader.skip(2); // reservedPad
        const startCodes = [];
        for (let i = 0; i < segCount; i++) startCodes.push(reader.readUint16());
        const idDeltas = [];
        for (let i = 0; i < segCount; i++) idDeltas.push(reader.readInt16());
        const idRangeOffsetPos = reader.tell();
        const idRangeOffsets = [];
        for (let i = 0; i < segCount; i++) idRangeOffsets.push(reader.readUint16());

        const mapping = {};
        for (let i = 0; i < segCount; i++) {
            const start = startCodes[i];
            const end = endCodes[i];
            const delta = idDeltas[i];
            const rangeOffset = idRangeOffsets[i];

            if (start === 0xFFFF) break;

            for (let c = start; c <= end; c++) {
                let glyphId;
                if (rangeOffset === 0) {
                    glyphId = (c + delta) & 0xFFFF;
                } else {
                    const offsetAddr = idRangeOffsetPos + i * 2 + rangeOffset + (c - start) * 2;
                    reader.seek(offsetAddr);
                    glyphId = reader.readUint16();
                    if (glyphId !== 0) glyphId = (glyphId + delta) & 0xFFFF;
                }
                if (glyphId !== 0) mapping[c] = glyphId;
            }
        }
        return mapping;
    }

    function parseCmapFormat12(reader, tableOffset) {
        reader.seek(tableOffset);
        reader.skip(2); // format
        reader.skip(2); // reserved
        const length = reader.readUint32();
        reader.skip(4); // language
        const numGroups = reader.readUint32();

        const mapping = {};
        for (let i = 0; i < numGroups; i++) {
            const startCharCode = reader.readUint32();
            const endCharCode = reader.readUint32();
            const startGlyphID = reader.readUint32();
            for (let c = startCharCode; c <= endCharCode; c++) {
                mapping[c] = startGlyphID + (c - startCharCode);
            }
        }
        return mapping;
    }

    function parseCmapFormat6(reader, tableOffset) {
        reader.seek(tableOffset);
        reader.skip(2); // format
        reader.skip(2); // length
        reader.skip(2); // language
        const firstCode = reader.readUint16();
        const entryCount = reader.readUint16();
        const mapping = {};
        for (let i = 0; i < entryCount; i++) {
            const gid = reader.readUint16();
            if (gid !== 0) mapping[firstCode + i] = gid;
        }
        return mapping;
    }

    function parseCmapFormat0(reader, tableOffset) {
        reader.seek(tableOffset);
        reader.skip(2); // format
        reader.skip(2); // length
        reader.skip(2); // language
        const mapping = {};
        for (let i = 0; i < 256; i++) {
            const gid = reader.readUint8();
            if (gid !== 0) mapping[i] = gid;
        }
        return mapping;
    }

    // =========================================================================
    // 'kern' table - Kerning (legacy format)
    // =========================================================================
    function parseKern(reader, table) {
        reader.seek(table.offset);
        const version = reader.readUint16();
        const nTables = reader.readUint16();
        const pairs = {};

        for (let t = 0; t < nTables; t++) {
            const subtableVersion = reader.readUint16();
            const length = reader.readUint16();
            const coverage = reader.readUint16();
            const format = coverage >> 8;

            if (format === 0) {
                // Format 0: ordered list of kerning pairs
                const nPairs = reader.readUint16();
                reader.skip(6); // searchRange, entrySelector, rangeShift
                for (let i = 0; i < nPairs; i++) {
                    const left = reader.readUint16();
                    const right = reader.readUint16();
                    const value = reader.readInt16();
                    if (value !== 0) {
                        if (!pairs[left]) pairs[left] = {};
                        pairs[left][right] = value;
                    }
                }
            } else {
                // Skip unsupported formats
                reader.skip(length - 6);
            }
        }
        return pairs;
    }

    // =========================================================================
    // 'GPOS' table - Glyph Positioning (OpenType) - pair adjustment only
    // =========================================================================
    function parseGPOS(reader, table) {
        const base = table.offset;
        reader.seek(base);
        const majorVersion = reader.readUint16();
        const minorVersion = reader.readUint16();
        const scriptListOffset = reader.readUint16();
        const featureListOffset = reader.readUint16();
        const lookupListOffset = reader.readUint16();

        const pairs = {};

        // Parse LookupList
        reader.seek(base + lookupListOffset);
        const lookupCount = reader.readUint16();
        const lookupOffsets = [];
        for (let i = 0; i < lookupCount; i++) {
            lookupOffsets.push(reader.readUint16());
        }

        for (const lkOff of lookupOffsets) {
            const lookupAddr = base + lookupListOffset + lkOff;
            reader.seek(lookupAddr);
            const lookupType = reader.readUint16();
            const lookupFlag = reader.readUint16();
            const subTableCount = reader.readUint16();
            const subTableOffsets = [];
            for (let i = 0; i < subTableCount; i++) {
                subTableOffsets.push(reader.readUint16());
            }

            // Only parse PairPos (type 2)
            if (lookupType !== 2) continue;

            for (const stOff of subTableOffsets) {
                try {
                    parseGPOSPairPos(reader, lookupAddr + stOff, pairs);
                } catch (e) {
                    // Skip broken subtables
                }
            }
        }
        return pairs;
    }

    function parseGPOSPairPos(reader, offset, pairs) {
        reader.seek(offset);
        const posFormat = reader.readUint16();
        const coverageOffset = reader.readUint16();
        const valueFormat1 = reader.readUint16();
        const valueFormat2 = reader.readUint16();

        // Only handle xAdvance in valueFormat1 (bit 2 = 0x0004)
        const vf1Size = countValueRecordSize(valueFormat1);
        const vf2Size = countValueRecordSize(valueFormat2);

        // Parse coverage to get first glyph set
        const coverage = parseGPOSCoverage(reader, offset + coverageOffset);

        if (posFormat === 1) {
            // Format 1: individual pairs
            const pairSetCount = reader.readUint16();
            const pairSetOffsets = [];
            for (let i = 0; i < pairSetCount; i++) {
                pairSetOffsets.push(reader.readUint16());
            }

            for (let i = 0; i < pairSetCount; i++) {
                const firstGlyph = coverage[i];
                if (firstGlyph === undefined) continue;
                reader.seek(offset + pairSetOffsets[i]);
                const pairValueCount = reader.readUint16();

                for (let j = 0; j < pairValueCount; j++) {
                    const secondGlyph = reader.readUint16();
                    const val1 = readValueRecord(reader, valueFormat1);
                    const val2 = readValueRecord(reader, valueFormat2);
                    const kern = val1.xAdvance || 0;
                    if (kern !== 0) {
                        if (!pairs[firstGlyph]) pairs[firstGlyph] = {};
                        pairs[firstGlyph][secondGlyph] = kern;
                    }
                }
            }
        } else if (posFormat === 2) {
            // Format 2: class-based pairs
            const classDef1Offset = reader.readUint16();
            const classDef2Offset = reader.readUint16();
            const class1Count = reader.readUint16();
            const class2Count = reader.readUint16();

            // Read pair values matrix
            const matrix = [];
            for (let c1 = 0; c1 < class1Count; c1++) {
                const row = [];
                for (let c2 = 0; c2 < class2Count; c2++) {
                    const val1 = readValueRecord(reader, valueFormat1);
                    const val2 = readValueRecord(reader, valueFormat2);
                    row.push(val1.xAdvance || 0);
                }
                matrix.push(row);
            }

            // Parse class definitions
            const classDef1 = parseGPOSClassDef(reader, offset + classDef1Offset);
            const classDef2 = parseGPOSClassDef(reader, offset + classDef2Offset);

            // Build glyph-to-glyph kerning from classes
            for (const gid of coverage) {
                const c1 = classDef1[gid] || 0;
                for (const [gid2Str, c2] of Object.entries(classDef2)) {
                    const kern = matrix[c1]?.[c2] || 0;
                    if (kern !== 0) {
                        const gid2 = parseInt(gid2Str);
                        if (!pairs[gid]) pairs[gid] = {};
                        pairs[gid][gid2] = kern;
                    }
                }
            }
        }
    }

    function countValueRecordSize(valueFormat) {
        let size = 0;
        for (let i = 0; i < 8; i++) {
            if (valueFormat & (1 << i)) size += 2;
        }
        return size;
    }

    function readValueRecord(reader, valueFormat) {
        const rec = {};
        if (valueFormat & 0x0001) rec.xPlacement = reader.readInt16();
        if (valueFormat & 0x0002) rec.yPlacement = reader.readInt16();
        if (valueFormat & 0x0004) rec.xAdvance = reader.readInt16();
        if (valueFormat & 0x0008) rec.yAdvance = reader.readInt16();
        if (valueFormat & 0x0010) reader.skip(2); // xPlaDevice
        if (valueFormat & 0x0020) reader.skip(2); // yPlaDevice
        if (valueFormat & 0x0040) reader.skip(2); // xAdvDevice
        if (valueFormat & 0x0080) reader.skip(2); // yAdvDevice
        return rec;
    }

    function parseGPOSCoverage(reader, offset) {
        reader.seek(offset);
        const format = reader.readUint16();
        const result = [];
        if (format === 1) {
            const glyphCount = reader.readUint16();
            for (let i = 0; i < glyphCount; i++) result.push(reader.readUint16());
        } else if (format === 2) {
            const rangeCount = reader.readUint16();
            for (let i = 0; i < rangeCount; i++) {
                const startGlyph = reader.readUint16();
                const endGlyph = reader.readUint16();
                reader.skip(2); // startCoverageIndex
                for (let g = startGlyph; g <= endGlyph; g++) result.push(g);
            }
        }
        return result;
    }

    function parseGPOSClassDef(reader, offset) {
        reader.seek(offset);
        const format = reader.readUint16();
        const classDef = {};
        if (format === 1) {
            const startGlyph = reader.readUint16();
            const glyphCount = reader.readUint16();
            for (let i = 0; i < glyphCount; i++) {
                classDef[startGlyph + i] = reader.readUint16();
            }
        } else if (format === 2) {
            const classRangeCount = reader.readUint16();
            for (let i = 0; i < classRangeCount; i++) {
                const startGlyph = reader.readUint16();
                const endGlyph = reader.readUint16();
                const classValue = reader.readUint16();
                for (let g = startGlyph; g <= endGlyph; g++) {
                    classDef[g] = classValue;
                }
            }
        }
        return classDef;
    }

    // =========================================================================
    // 'loca' table - Glyph locations (TrueType)
    // =========================================================================
    // ==========================================================================
    // Phase 11: HarfBuzz WASM 統合 (ミニマム)
    // ==========================================================================
    // 標準では使わず (FontEngine3D の単純レイアウトで描画)、ユーザーが
    // window._harfbuzzInstance に harfbuzzjs インスタンスをセットしたら
    // それを使う。CDN からの読み込み手順は README に記載。
    //
    // shapeText(typefaceJSON, text, fontBuffer): 戻り値は
    //   [{ glyphId, x_advance, y_offset, ... }, ...]
    // という HarfBuzz 標準のシェイピング結果配列。
    //
    // 「合字 (fi → ﬁ) / アラビア語 (右→左、コンテキスト依存) / インド系
    // 結合文字 / CJK 縦書き」など FontEngine3D 単独では正確に処理できない
    // ケースで、HarfBuzz が利用可能ならその結果を優先する。利用不可なら
    // FontEngine3D の simple layout に fallback する。
    function shapeText(typefaceJSON, text, fontBuffer) {
        if (typeof window === 'undefined' || !window._harfbuzzInstance) {
            return null; // HarfBuzz 未利用 → caller は fallback すべき
        }
        try {
            const hb = window._harfbuzzInstance;
            const blob = hb.createBlob(fontBuffer);
            const face = hb.createFace(blob, 0);
            const font = hb.createFont(face);
            const buffer = hb.createBuffer();
            buffer.addText(text);
            buffer.guessSegmentProperties();
            hb.shape(font, buffer);
            const result = buffer.json();
            buffer.destroy();
            font.destroy();
            face.destroy();
            blob.destroy();
            return result;
        } catch (e) {
            console.warn('HarfBuzz shaping failed, falling back:', e);
            return null;
        }
    }

    // Phase 11: 'fvar' table — Variable Font axis info (簡易版)
    // 戻り値: [{ tag, min, default, max }, ...]
    function parseFvarAxes(reader, table) {
        if (!table) return [];
        try {
            reader.seek(table.offset);
            reader.skip(2); // majorVersion
            reader.skip(2); // minorVersion
            const axesOffset = reader.readUint16();
            reader.skip(2); // reserved
            const axisCount = reader.readUint16();
            const axisSize = reader.readUint16();
            reader.skip(2); reader.skip(2); // instanceCount + instanceSize
            const axes = [];
            for (let i = 0; i < axisCount; i++) {
                reader.seek(table.offset + axesOffset + i * axisSize);
                const a = String.fromCharCode(reader.readUint8());
                const b = String.fromCharCode(reader.readUint8());
                const c = String.fromCharCode(reader.readUint8());
                const d = String.fromCharCode(reader.readUint8());
                const tag = a + b + c + d;
                const min = reader.readInt32() / 65536;
                const def = reader.readInt32() / 65536;
                const max = reader.readInt32() / 65536;
                axes.push({ tag, min, default: def, max });
            }
            return axes;
        } catch (e) {
            return [];
        }
    }

    function parseLoca(reader, table, numGlyphs, indexToLocFormat) {
        reader.seek(table.offset);
        const offsets = [];
        if (indexToLocFormat === 0) {
            // Short format: offset / 2
            for (let i = 0; i <= numGlyphs; i++) offsets.push(reader.readUint16() * 2);
        } else {
            // Long format
            for (let i = 0; i <= numGlyphs; i++) offsets.push(reader.readUint32());
        }
        return offsets;
    }

    // =========================================================================
    // 'glyf' table - TrueType Glyph outlines
    // =========================================================================
    function parseGlyfTable(reader, glyfTable, locaOffsets, numGlyphs) {
        // 旧仕様では全グリフを事前パースしていたが、日本語フォント等で
        // numGlyphs が 1万を超える場合に強烈な UI フリーズを引き起こすため廃止。
        // parseGlyph は内部キャッシュ（glyphsCache）を持ち、composite glyph も
        // 参照時に再帰的に解決できるため、空グリフ以外は遅延でも整合性は保たれる。
        const glyphs = new Array(numGlyphs);
        for (let i = 0; i < numGlyphs; i++) {
            const offset = locaOffsets[i];
            const nextOffset = locaOffsets[i + 1];
            if (offset === nextOffset) {
                // Empty glyph (e.g. space)
                glyphs[i] = { contours: [], xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
            } else {
                glyphs[i] = null; // 遅延：実際にアクセスされた時に parseGlyph
            }
        }
        return glyphs;
    }

    function parseGlyph(reader, glyfOffset, locaOffsets, glyphIndex, glyphsCache) {
        if (glyphsCache[glyphIndex] && glyphsCache[glyphIndex].contours) {
            return glyphsCache[glyphIndex];
        }

        const offset = locaOffsets[glyphIndex];
        const nextOffset = locaOffsets[glyphIndex + 1];

        if (offset === nextOffset) {
            const g = { contours: [], xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
            glyphsCache[glyphIndex] = g;
            return g;
        }

        reader.seek(glyfOffset + offset);
        const numberOfContours = reader.readInt16();
        const xMin = reader.readInt16();
        const yMin = reader.readInt16();
        const xMax = reader.readInt16();
        const yMax = reader.readInt16();

        if (numberOfContours >= 0) {
            return parseSimpleGlyph(reader, numberOfContours, xMin, yMin, xMax, yMax);
        } else {
            return parseCompositeGlyph(reader, glyfOffset, locaOffsets, glyphsCache, xMin, yMin, xMax, yMax);
        }
    }

    function parseSimpleGlyph(reader, numberOfContours, xMin, yMin, xMax, yMax) {
        if (numberOfContours === 0) {
            return { contours: [], xMin, yMin, xMax, yMax };
        }

        // Read endPtsOfContours
        const endPts = [];
        for (let i = 0; i < numberOfContours; i++) endPts.push(reader.readUint16());

        const numPoints = endPts[endPts.length - 1] + 1;

        // Skip instructions
        const instructionLength = reader.readUint16();
        reader.skip(instructionLength);

        // Read flags
        const flags = [];
        for (let i = 0; i < numPoints;) {
            const flag = reader.readUint8();
            flags.push(flag);
            i++;
            if (flag & 0x08) { // repeat
                const repeatCount = reader.readUint8();
                for (let j = 0; j < repeatCount; j++) {
                    flags.push(flag);
                    i++;
                }
            }
        }

        // Read X coordinates
        const xs = new Array(numPoints);
        let x = 0;
        for (let i = 0; i < numPoints; i++) {
            const flag = flags[i];
            if (flag & 0x02) {
                const dx = reader.readUint8();
                x += (flag & 0x10) ? dx : -dx;
            } else if (!(flag & 0x10)) {
                x += reader.readInt16();
            }
            xs[i] = x;
        }

        // Read Y coordinates
        const ys = new Array(numPoints);
        let y = 0;
        for (let i = 0; i < numPoints; i++) {
            const flag = flags[i];
            if (flag & 0x04) {
                const dy = reader.readUint8();
                y += (flag & 0x20) ? dy : -dy;
            } else if (!(flag & 0x20)) {
                y += reader.readInt16();
            }
            ys[i] = y;
        }

        // Build contours with on-curve flag
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            points.push({ x: xs[i], y: ys[i], onCurve: !!(flags[i] & 0x01) });
        }

        const contours = [];
        let start = 0;
        for (let c = 0; c < numberOfContours; c++) {
            const end = endPts[c];
            contours.push(points.slice(start, end + 1));
            start = end + 1;
        }

        return { contours, xMin, yMin, xMax, yMax };
    }

    function parseCompositeGlyph(reader, glyfOffset, locaOffsets, glyphsCache, xMin, yMin, xMax, yMax) {
        const contours = [];
        let hasMore = true;

        while (hasMore) {
            const flags = reader.readUint16();
            const glyphIndex = reader.readUint16();

            let arg1, arg2;
            if (flags & 0x01) { // ARG_1_AND_2_ARE_WORDS
                if (flags & 0x02) { // ARGS_ARE_XY_VALUES
                    arg1 = reader.readInt16();
                    arg2 = reader.readInt16();
                } else {
                    arg1 = reader.readUint16();
                    arg2 = reader.readUint16();
                }
            } else {
                if (flags & 0x02) {
                    arg1 = reader.readInt8();
                    arg2 = reader.readInt8();
                } else {
                    arg1 = reader.readUint8();
                    arg2 = reader.readUint8();
                }
            }

            let a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0;
            if (flags & 0x02) { // ARGS_ARE_XY_VALUES
                tx = arg1;
                ty = arg2;
            }

            if (flags & 0x08) { // WE_HAVE_A_SCALE
                a = d = reader.readF2Dot14();
            } else if (flags & 0x40) { // WE_HAVE_AN_X_AND_Y_SCALE
                a = reader.readF2Dot14();
                d = reader.readF2Dot14();
            } else if (flags & 0x80) { // WE_HAVE_A_TWO_BY_TWO
                a = reader.readF2Dot14();
                b = reader.readF2Dot14();
                c = reader.readF2Dot14();
                d = reader.readF2Dot14();
            }

            // Recursively parse the component glyph
            const savedOffset = reader.tell();
            const component = parseGlyph(reader, glyfOffset, locaOffsets, glyphIndex, glyphsCache);
            reader.seek(savedOffset);

            // Transform and add contours
            for (const contour of component.contours) {
                const transformedContour = contour.map(p => ({
                    x: a * p.x + c * p.y + tx,
                    y: b * p.x + d * p.y + ty,
                    onCurve: p.onCurve
                }));
                contours.push(transformedContour);
            }

            hasMore = !!(flags & 0x20); // MORE_COMPONENTS
        }

        return { contours, xMin, yMin, xMax, yMax };
    }

    // =========================================================================
    // Convert TrueType contours to path commands string
    // TrueType uses quadratic bezier curves
    // Uses ring-based algorithm to correctly handle contour closing
    // =========================================================================
    function ttContourToCommands(contour) {
        if (!contour || contour.length === 0) return '';
        const n = contour.length;
        if (n === 1) return `m ${contour[0].x} ${contour[0].y}`;

        // Ring accessor: wraps around
        const pt = (i) => contour[((i % n) + n) % n];

        // Find first on-curve point
        let firstOnCurve = -1;
        for (let i = 0; i < n; i++) {
            if (pt(i).onCurve) { firstOnCurve = i; break; }
        }

        let startX, startY, startProcessIdx;

        if (firstOnCurve >= 0) {
            startX = pt(firstOnCurve).x;
            startY = pt(firstOnCurve).y;
            startProcessIdx = firstOnCurve + 1;
        } else {
            // All off-curve: virtual on-curve start at midpoint of first and last
            startX = Math.round((pt(0).x + pt(n - 1).x) / 2);
            startY = Math.round((pt(0).y + pt(n - 1).y) / 2);
            startProcessIdx = 0;
        }

        const cmds = [`m ${startX} ${startY}`];

        // Process exactly n points in the ring, starting from startProcessIdx
        // This ensures we traverse the entire contour and close back to start
        let remaining = n;
        let idx = startProcessIdx;

        while (remaining > 0) {
            const p = pt(idx);

            if (p.onCurve) {
                cmds.push(`l ${p.x} ${p.y}`);
                idx++;
                remaining--;
            } else {
                // Off-curve: quadratic bezier control point
                const pNext = pt(idx + 1);

                if (pNext.onCurve) {
                    // Simple case: off-curve control + on-curve endpoint
                    cmds.push(`q ${p.x} ${p.y} ${pNext.x} ${pNext.y}`);
                    idx += 2;
                    remaining -= 2;
                } else {
                    // Two consecutive off-curve: implied on-curve midpoint
                    const mx = Math.round((p.x + pNext.x) / 2);
                    const my = Math.round((p.y + pNext.y) / 2);
                    cmds.push(`q ${p.x} ${p.y} ${mx} ${my}`);
                    idx++;
                    remaining--;
                }
            }
        }

        return cmds.join(' ');
    }

    // =========================================================================
    // CFF (Compact Font Format) Parser - for OTF fonts
    // =========================================================================

    function parseCFF(reader, table, isCFF2) {
        const cffOffset = table.offset;
        reader.seek(cffOffset);

        // CFF Header
        const major = reader.readUint8();
        const minor = reader.readUint8();
        const hdrSize = reader.readUint8();

        // CFF2 has different header (topDictLength instead of offSize)
        let offSize;
        let topDictLength;
        if (major >= 2) {
            topDictLength = reader.readUint16();
            isCFF2 = true;
        } else {
            offSize = reader.readUint8();
        }

        let numRegions = 0; // for CFF2 blend operator

        if (isCFF2) {
            // CFF2: header → Top DICT → Global Subr INDEX
            // Top DICT is inline (not an INDEX)
            reader.seek(cffOffset + hdrSize);
            const topDictData = reader.readBytes(topDictLength);
            const topDict = parseCFFDict(topDictData);

            // Global Subr INDEX follows Top DICT
            reader.seek(cffOffset + hdrSize + topDictLength);
            const globalSubrIndex = parseCFFIndex(reader);

            // CharStrings
            const charStringsOffset = topDict.charStrings;
            reader.seek(cffOffset + charStringsOffset);
            const charStringsIndex = parseCFFIndex(reader);
            const numGlyphs = charStringsIndex.data.length;

            // Try to get numRegions from ItemVariationStore (vstore, key 24)
            // For now, assume 0 regions for default instance
            if (topDict.vstore !== undefined) {
                try {
                    reader.seek(cffOffset + topDict.vstore);
                    const vsLength = reader.readUint16();
                    const vsMajor = reader.readUint16();
                    const vsMinor = reader.readUint16();
                    const varRegionListOffset = reader.readUint32();
                    const itemVarDataCount = reader.readUint16();
                    if (itemVarDataCount > 0) {
                        reader.readUint32(); // first itemVarData offset
                        // Read VariationRegionList to count regions
                        reader.seek(cffOffset + topDict.vstore + 2 + varRegionListOffset);
                        const axisCount = reader.readUint16();
                        numRegions = reader.readUint16();
                    }
                } catch(e) { numRegions = 0; }
            }

            // FDArray and FDSelect
            let privateDicts = [];
            let localSubrIndices = [];
            let fdSelect = null;
            const isCID = topDict.fdArray !== undefined;

            if (isCID && topDict.fdArray !== undefined) {
                reader.seek(cffOffset + topDict.fdArray);
                const fdArrayIndex = parseCFFIndex(reader);

                if (topDict.fdSelect !== undefined) {
                    reader.seek(cffOffset + topDict.fdSelect);
                    fdSelect = parseFDSelect(reader, numGlyphs);
                }

                for (let i = 0; i < fdArrayIndex.data.length; i++) {
                    const fdDict = parseCFFDict(fdArrayIndex.data[i]);
                    if (fdDict.private) {
                        const privSize = fdDict.private[0];
                        const privOffset = fdDict.private[1];
                        reader.seek(cffOffset + privOffset);
                        const privData = reader.readBytes(privSize);
                        const privDict = parseCFFDict(privData);
                        privDict._offset = privOffset;
                        privateDicts.push(privDict);
                        if (privDict.subrs !== undefined) {
                            reader.seek(cffOffset + privOffset + privDict.subrs);
                            localSubrIndices.push(parseCFFIndex(reader));
                        } else {
                            localSubrIndices.push(null);
                        }
                    } else {
                        privateDicts.push({});
                        localSubrIndices.push(null);
                    }
                }
            } else {
                if (topDict.private) {
                    const privSize = topDict.private[0];
                    const privOffset = topDict.private[1];
                    reader.seek(cffOffset + privOffset);
                    const privData = reader.readBytes(privSize);
                    const privDict = parseCFFDict(privData);
                    privDict._offset = privOffset;
                    privateDicts.push(privDict);
                    if (privDict.subrs !== undefined) {
                        reader.seek(cffOffset + privOffset + privDict.subrs);
                        localSubrIndices.push(parseCFFIndex(reader));
                    } else {
                        localSubrIndices.push(null);
                    }
                } else {
                    privateDicts.push({});
                    localSubrIndices.push(null);
                }
            }

            return {
                charStringsIndex,
                globalSubrIndex,
                privateDicts,
                localSubrIndices,
                fdSelect,
                isCID,
                isCFF2: true,
                numRegions,
                topDict,
                numGlyphs,
                defaultWidthX: privateDicts.map(d => d.defaultWidthX || 0),
                nominalWidthX: privateDicts.map(d => d.nominalWidthX || 0)
            };
        }

        // CFF1 parsing (original logic)

        // Name INDEX
        reader.seek(cffOffset + hdrSize);
        const nameIndex = parseCFFIndex(reader);

        // Top DICT INDEX
        const topDictIndex = parseCFFIndex(reader);

        // String INDEX
        const stringIndex = parseCFFIndex(reader);

        // Global Subr INDEX
        const globalSubrIndex = parseCFFIndex(reader);

        // Parse Top DICT
        const topDict = parseCFFDict(topDictIndex.data[0]);

        // Get charset
        const charsetOffset = topDict.charset || 0;

        // Get CharStrings
        const charStringsOffset = topDict.charStrings;
        reader.seek(cffOffset + charStringsOffset);
        const charStringsIndex = parseCFFIndex(reader);
        const numGlyphs = charStringsIndex.data.length;

        // Check if this is a CID font
        const isCID = topDict.ros !== undefined;

        // Parse Private DICT and Local Subrs
        let privateDicts = [];
        let localSubrIndices = [];

        if (isCID) {
            // CID font: FDArray contains multiple Font DICTs, each with its own Private DICT
            const fdArrayOffset = topDict.fdArray;
            reader.seek(cffOffset + fdArrayOffset);
            const fdArrayIndex = parseCFFIndex(reader);

            // FDSelect
            const fdSelectOffset = topDict.fdSelect;
            reader.seek(cffOffset + fdSelectOffset);
            const fdSelect = parseFDSelect(reader, numGlyphs);

            for (let i = 0; i < fdArrayIndex.data.length; i++) {
                const fdDict = parseCFFDict(fdArrayIndex.data[i]);
                if (fdDict.private) {
                    const privSize = fdDict.private[0];
                    const privOffset = fdDict.private[1];
                    reader.seek(cffOffset + privOffset);
                    const privData = reader.readBytes(privSize);
                    const privDict = parseCFFDict(privData);
                    privDict._offset = privOffset;
                    privateDicts.push(privDict);

                    // Local Subrs
                    if (privDict.subrs !== undefined) {
                        reader.seek(cffOffset + privOffset + privDict.subrs);
                        const localSubrs = parseCFFIndex(reader);
                        localSubrIndices.push(localSubrs);
                    } else {
                        localSubrIndices.push(null);
                    }
                } else {
                    privateDicts.push({});
                    localSubrIndices.push(null);
                }
            }

            return {
                charStringsIndex,
                globalSubrIndex,
                privateDicts,
                localSubrIndices,
                fdSelect,
                isCID: true,
                topDict,
                numGlyphs,
                defaultWidthX: privateDicts.map(d => d.defaultWidthX || 0),
                nominalWidthX: privateDicts.map(d => d.nominalWidthX || 0)
            };
        } else {
            // Non-CID font: single Private DICT
            if (topDict.private) {
                const privSize = topDict.private[0];
                const privOffset = topDict.private[1];
                reader.seek(cffOffset + privOffset);
                const privData = reader.readBytes(privSize);
                const privDict = parseCFFDict(privData);
                privDict._offset = privOffset;
                privateDicts.push(privDict);

                if (privDict.subrs !== undefined) {
                    reader.seek(cffOffset + privOffset + privDict.subrs);
                    const localSubrs = parseCFFIndex(reader);
                    localSubrIndices.push(localSubrs);
                } else {
                    localSubrIndices.push(null);
                }
            } else {
                privateDicts.push({});
                localSubrIndices.push(null);
            }

            return {
                charStringsIndex,
                globalSubrIndex,
                privateDicts,
                localSubrIndices,
                fdSelect: null,
                isCID: false,
                topDict,
                numGlyphs,
                defaultWidthX: [privateDicts[0].defaultWidthX || 0],
                nominalWidthX: [privateDicts[0].nominalWidthX || 0]
            };
        }
    }

    // Parse FDSelect structure (maps GID to FD index)
    function parseFDSelect(reader, numGlyphs) {
        const format = reader.readUint8();
        const mapping = new Uint8Array(numGlyphs);

        if (format === 0) {
            for (let i = 0; i < numGlyphs; i++) {
                mapping[i] = reader.readUint8();
            }
        } else if (format === 3) {
            const nRanges = reader.readUint16();
            for (let i = 0; i < nRanges; i++) {
                const first = reader.readUint16();
                const fd = reader.readUint8();
                const next = (i + 1 < nRanges) ? reader.data.getUint16(reader.tell(), false) : numGlyphs;
                for (let g = first; g < next && g < numGlyphs; g++) {
                    mapping[g] = fd;
                }
            }
            reader.readUint16(); // sentinel
        }
        return mapping;
    }

    // Parse CFF INDEX structure
    function parseCFFIndex(reader) {
        const count = reader.readUint16();
        if (count === 0) return { data: [], count: 0 };

        const offSize = reader.readUint8();
        const offsets = [];
        for (let i = 0; i <= count; i++) {
            let off = 0;
            for (let j = 0; j < offSize; j++) {
                off = (off << 8) | reader.readUint8();
            }
            offsets.push(off);
        }

        const dataStart = reader.tell() - 1; // offsets are 1-based
        const data = [];
        for (let i = 0; i < count; i++) {
            const start = dataStart + offsets[i];
            const end = dataStart + offsets[i + 1];
            const len = end - start;
            const savedPos = reader.tell();
            reader.seek(start);
            data.push(reader.readBytes(len));
            reader.seek(savedPos);
        }

        // Advance reader past all data
        reader.seek(dataStart + offsets[count]);

        return { data, count };
    }

    // Parse CFF DICT from byte array
    function parseCFFDict(data) {
        const dict = {};
        const stack = [];
        let i = 0;

        while (i < data.length) {
            const b0 = data[i];

            if (b0 >= 32 && b0 <= 246) {
                stack.push(b0 - 139);
                i++;
            } else if (b0 >= 247 && b0 <= 250) {
                const b1 = data[i + 1];
                stack.push((b0 - 247) * 256 + b1 + 108);
                i += 2;
            } else if (b0 >= 251 && b0 <= 254) {
                const b1 = data[i + 1];
                stack.push(-(b0 - 251) * 256 - b1 - 108);
                i += 2;
            } else if (b0 === 28) {
                const val = (data[i + 1] << 8) | data[i + 2];
                stack.push(val > 32767 ? val - 65536 : val);
                i += 3;
            } else if (b0 === 29) {
                const val = (data[i + 1] << 24) | (data[i + 2] << 16) | (data[i + 3] << 8) | data[i + 4];
                stack.push(val);
                i += 5;
            } else if (b0 === 30) {
                // Real number
                let s = '';
                i++;
                let done = false;
                while (!done && i < data.length) {
                    const byte = data[i++];
                    const nibbles = [(byte >> 4) & 0x0f, byte & 0x0f];
                    for (const n of nibbles) {
                        if (n <= 9) s += n;
                        else if (n === 0xa) s += '.';
                        else if (n === 0xb) s += 'E';
                        else if (n === 0xc) s += 'E-';
                        else if (n === 0xe) s += '-';
                        else if (n === 0xf) { done = true; break; }
                    }
                }
                stack.push(parseFloat(s));
            } else if (b0 === 12) {
                // Two-byte operator
                const b1 = data[i + 1];
                const op = 1200 + b1;
                applyDictOp(dict, op, stack);
                stack.length = 0;
                i += 2;
            } else if (b0 <= 25) {
                applyDictOp(dict, b0, stack);
                stack.length = 0;
                i++;
            } else {
                i++; // skip unknown
            }
        }
        return dict;
    }

    function applyDictOp(dict, op, stack) {
        const ops = {
            0: 'version', 1: 'notice', 2: 'fullName', 3: 'familyName',
            4: 'weight', 5: 'fontBBox', 13: 'uniqueID',
            14: 'xuid', 15: 'charset', 16: 'encoding', 17: 'charStrings',
            18: 'private', 19: 'subrs', 20: 'defaultWidthX', 21: 'nominalWidthX',
            24: 'vstore', 25: 'maxstack',
            1200: 'copyright', 1201: 'isFixedPitch', 1202: 'italicAngle',
            1203: 'underlinePosition', 1204: 'underlineThickness',
            1206: 'charstringType', 1207: 'fontMatrix',
            1230: 'ros', 1231: 'cidFontVersion', 1232: 'cidFontRevision',
            1233: 'cidFontType', 1234: 'cidCount', 1235: 'uidBase',
            1236: 'fdArray', 1237: 'fdSelect',
        };

        const name = ops[op];
        if (name) {
            if (stack.length === 1) {
                dict[name] = stack[0];
            } else {
                dict[name] = stack.slice();
            }
        }
    }

    // =========================================================================
    // CharString2 Interpreter - executes CFF charstring programs
    // =========================================================================
    function executeCharString(charStringData, globalSubrs, localSubrs, defaultWidthX, nominalWidthX, numRegions) {
        numRegions = numRegions || 0;
        const path = [];
        let x = 0, y = 0;
        let width = null;
        let nStems = 0;
        let haveWidth = false;
        let open = false;

        // CRITICAL: Single shared stack across all subroutine calls
        const stack = [];

        function moveTo(dx, dy) {
            if (open) path.push({ type: 'close' });
            x += dx; y += dy;
            path.push({ type: 'move', x, y });
            open = true;
        }

        function lineTo(dx, dy) {
            x += dx; y += dy;
            path.push({ type: 'line', x, y });
        }

        function curveTo(dx1, dy1, dx2, dy2, dx3, dy3) {
            const x1 = x + dx1, y1 = y + dy1;
            const x2 = x1 + dx2, y2 = y1 + dy2;
            const x3 = x2 + dx3, y3 = y2 + dy3;
            path.push({ type: 'cubic', x1, y1, x2, y2, x: x3, y: y3 });
            x = x3; y = y3;
        }

        function getSubrBias(count) {
            if (count < 1240) return 107;
            if (count < 33900) return 1131;
            return 32768;
        }

        const globalBias = globalSubrs ? getSubrBias(globalSubrs.data.length) : 0;
        const localBias = localSubrs ? getSubrBias(localSubrs.data.length) : 0;

        // Use an explicit call stack instead of recursion to share the operand stack
        const callStack = []; // stores { data, index } for return

        let data = charStringData;
        let i = 0;
        let ended = false;

        while (!ended) {
            if (i >= data.length) {
                // Implicit return at end of data
                if (callStack.length > 0) {
                    const ret = callStack.pop();
                    data = ret.data;
                    i = ret.i;
                    continue;
                }
                break;
            }

            const b0 = data[i];

            // ---- Number encoding ----
            if (b0 >= 32 && b0 <= 246) {
                stack.push(b0 - 139);
                i++;
                continue;
            }
            if (b0 >= 247 && b0 <= 250) {
                stack.push((b0 - 247) * 256 + data[i + 1] + 108);
                i += 2;
                continue;
            }
            if (b0 >= 251 && b0 <= 254) {
                stack.push(-(b0 - 251) * 256 - data[i + 1] - 108);
                i += 2;
                continue;
            }
            if (b0 === 28) {
                let val = (data[i + 1] << 8) | data[i + 2];
                if (val > 32767) val -= 65536;
                stack.push(val);
                i += 3;
                continue;
            }
            if (b0 === 255) {
                const val = (data[i + 1] << 24) | (data[i + 2] << 16) | (data[i + 3] << 8) | data[i + 4];
                stack.push(val / 65536);
                i += 5;
                continue;
            }

            // ---- Operators ----
            i++;

            if (b0 === 12) {
                const b1 = data[i++];
                switch (b1) {
                    case 34: // hflex
                    {
                        curveTo(stack[0], 0, stack[1], stack[2], stack[3], 0);
                        curveTo(stack[4], 0, stack[5], -stack[2], stack[6], 0);
                        stack.length = 0;
                        break;
                    }
                    case 35: // flex
                    {
                        curveTo(stack[0], stack[1], stack[2], stack[3], stack[4], stack[5]);
                        curveTo(stack[6], stack[7], stack[8], stack[9], stack[10], stack[11]);
                        stack.length = 0;
                        break;
                    }
                    case 36: // hflex1
                    {
                        const dy1 = stack[1], dy2 = stack[3], dy5 = stack[7];
                        curveTo(stack[0], dy1, stack[2], dy2, stack[4], 0);
                        curveTo(stack[5], 0, stack[6], dy5, stack[8], -(dy1 + dy2 + dy5));
                        stack.length = 0;
                        break;
                    }
                    case 37: // flex1
                    {
                        const dx1 = stack[0], dy1 = stack[1];
                        const dx2 = stack[2], dy2 = stack[3];
                        const dx3 = stack[4], dy3 = stack[5];
                        const dx4 = stack[6], dy4 = stack[7];
                        const dx5 = stack[8], dy5 = stack[9];
                        const sumDx = dx1 + dx2 + dx3 + dx4 + dx5;
                        const sumDy = dy1 + dy2 + dy3 + dy4 + dy5;
                        let dx6, dy6;
                        if (Math.abs(sumDx) > Math.abs(sumDy)) {
                            dx6 = stack[10]; dy6 = -sumDy;
                        } else {
                            dx6 = -sumDx; dy6 = stack[10];
                        }
                        curveTo(dx1, dy1, dx2, dy2, dx3, dy3);
                        curveTo(dx4, dy4, dx5, dy5, dx6, dy6);
                        stack.length = 0;
                        break;
                    }
                    default:
                        // Arithmetic operators
                        switch (b1) {
                            case 9: { const a = stack.pop(); stack.push(Math.abs(a)); break; }
                            case 10: { const b = stack.pop(), a = stack.pop(); stack.push(a + b); break; }
                            case 11: { const b = stack.pop(), a = stack.pop(); stack.push(a - b); break; }
                            case 12: { const b = stack.pop(), a = stack.pop(); stack.push(b !== 0 ? a / b : 0); break; }
                            case 14: { const a = stack.pop(); stack.push(-a); break; }
                            case 23: stack.push(1); break; // random
                            case 24: { const b = stack.pop(), a = stack.pop(); stack.push(a * b); break; }
                            case 26: { const a = stack.pop(); stack.push(Math.sqrt(Math.abs(a))); break; }
                            case 18: stack.pop(); break; // drop
                            case 27: stack.push(stack[stack.length - 1]); break; // dup
                            case 28: { // exch
                                const b = stack.pop(), a = stack.pop();
                                stack.push(b, a); break;
                            }
                            case 29: { // index
                                const idx = stack.pop();
                                stack.push(stack[stack.length - 1 - Math.max(0, idx)] || 0);
                                break;
                            }
                            case 30: { // roll
                                const j = stack.pop(), n = stack.pop();
                                if (n > 0 && stack.length >= n) {
                                    const arr = stack.splice(stack.length - n, n);
                                    const shift = ((j % n) + n) % n;
                                    for (let k = 0; k < n; k++) stack.push(arr[(k + n - shift) % n]);
                                }
                                break;
                            }
                            case 3: { const b = stack.pop(), a = stack.pop(); stack.push((a && b) ? 1 : 0); break; }
                            case 4: { const b = stack.pop(), a = stack.pop(); stack.push((a || b) ? 1 : 0); break; }
                            case 5: { const a = stack.pop(); stack.push(a ? 0 : 1); break; }
                            case 15: { const b = stack.pop(), a = stack.pop(); stack.push(a === b ? 1 : 0); break; }
                            default: break;
                        }
                        break;
                }
                continue;
            }

            switch (b0) {
                case 1:  // hstem
                case 3:  // vstem
                case 18: // hstemhm
                case 23: // vstemhm
                {
                    if (!haveWidth && (stack.length % 2 !== 0)) {
                        width = nominalWidthX + stack.shift();
                        haveWidth = true;
                    }
                    nStems += stack.length >> 1;
                    stack.length = 0;
                    break;
                }
                case 19: // hintmask
                case 20: // cntrmask
                {
                    if (!haveWidth && stack.length > 0 && (stack.length % 2 !== 0)) {
                        width = nominalWidthX + stack.shift();
                        haveWidth = true;
                    }
                    nStems += stack.length >> 1;
                    stack.length = 0;
                    i += Math.ceil(nStems / 8);
                    break;
                }
                case 21: // rmoveto
                {
                    if (!haveWidth && stack.length > 2) {
                        width = nominalWidthX + stack.shift();
                        haveWidth = true;
                    }
                    moveTo(stack[0] || 0, stack[1] || 0);
                    stack.length = 0;
                    break;
                }
                case 22: // hmoveto
                {
                    if (!haveWidth && stack.length > 1) {
                        width = nominalWidthX + stack.shift();
                        haveWidth = true;
                    }
                    moveTo(stack[0] || 0, 0);
                    stack.length = 0;
                    break;
                }
                case 4: // vmoveto
                {
                    if (!haveWidth && stack.length > 1) {
                        width = nominalWidthX + stack.shift();
                        haveWidth = true;
                    }
                    moveTo(0, stack[0] || 0);
                    stack.length = 0;
                    break;
                }
                case 5: // rlineto
                {
                    for (let j = 0; j + 1 < stack.length; j += 2) {
                        lineTo(stack[j], stack[j + 1]);
                    }
                    stack.length = 0;
                    break;
                }
                case 6: // hlineto
                {
                    for (let j = 0; j < stack.length; j++) {
                        if (j % 2 === 0) lineTo(stack[j], 0);
                        else lineTo(0, stack[j]);
                    }
                    stack.length = 0;
                    break;
                }
                case 7: // vlineto
                {
                    for (let j = 0; j < stack.length; j++) {
                        if (j % 2 === 0) lineTo(0, stack[j]);
                        else lineTo(stack[j], 0);
                    }
                    stack.length = 0;
                    break;
                }
                case 8: // rrcurveto
                {
                    for (let j = 0; j + 5 <= stack.length; j += 6) {
                        curveTo(stack[j], stack[j+1], stack[j+2], stack[j+3], stack[j+4], stack[j+5]);
                    }
                    stack.length = 0;
                    break;
                }
                case 24: // rcurveline
                {
                    const n = stack.length - 2;
                    for (let j = 0; j + 5 <= n; j += 6) {
                        curveTo(stack[j], stack[j+1], stack[j+2], stack[j+3], stack[j+4], stack[j+5]);
                    }
                    lineTo(stack[n], stack[n + 1]);
                    stack.length = 0;
                    break;
                }
                case 25: // rlinecurve
                {
                    const n = stack.length - 6;
                    for (let j = 0; j + 1 <= n; j += 2) {
                        lineTo(stack[j], stack[j + 1]);
                    }
                    curveTo(stack[n], stack[n+1], stack[n+2], stack[n+3], stack[n+4], stack[n+5]);
                    stack.length = 0;
                    break;
                }
                case 26: // vvcurveto
                {
                    let j = 0;
                    let dx1 = 0;
                    if (stack.length % 4 !== 0) dx1 = stack[j++];
                    while (j + 3 <= stack.length) {
                        curveTo(dx1, stack[j], stack[j+1], stack[j+2], 0, stack[j+3]);
                        dx1 = 0;
                        j += 4;
                    }
                    stack.length = 0;
                    break;
                }
                case 27: // hhcurveto
                {
                    let j = 0;
                    let dy1 = 0;
                    if (stack.length % 4 !== 0) dy1 = stack[j++];
                    while (j + 3 <= stack.length) {
                        curveTo(stack[j], dy1, stack[j+1], stack[j+2], stack[j+3], 0);
                        dy1 = 0;
                        j += 4;
                    }
                    stack.length = 0;
                    break;
                }
                case 30: // vhcurveto
                {
                    // Alternating vertical-start / horizontal-start curves
                    // Extra final arg goes to last curve only
                    const len = stack.length;
                    const hasExtra = (len % 4 !== 0);
                    let j = 0;
                    let phase = 0; // 0 = vertical start, 1 = horizontal start

                    while (j + 3 <= len) {
                        const remaining = len - j;
                        const isLast = remaining <= 5;
                        if (phase === 0) {
                            // vertical start: (0, dy1) (dx2, dy2) (dx3, extra?)
                            const extra = (isLast && hasExtra) ? stack[j + 4] : 0;
                            curveTo(0, stack[j], stack[j+1], stack[j+2], stack[j+3], extra);
                            j += 4 + (isLast && hasExtra ? 1 : 0);
                        } else {
                            // horizontal start: (dx1, 0) (dx2, dy2) (extra?, dy3)
                            const extra = (isLast && hasExtra) ? stack[j + 4] : 0;
                            curveTo(stack[j], 0, stack[j+1], stack[j+2], extra, stack[j+3]);
                            j += 4 + (isLast && hasExtra ? 1 : 0);
                        }
                        phase = 1 - phase;
                    }
                    stack.length = 0;
                    break;
                }
                case 31: // hvcurveto
                {
                    const len = stack.length;
                    const hasExtra = (len % 4 !== 0);
                    let j = 0;
                    let phase = 0; // 0 = horizontal start, 1 = vertical start

                    while (j + 3 <= len) {
                        const remaining = len - j;
                        const isLast = remaining <= 5;
                        if (phase === 0) {
                            // horizontal start: (dx1, 0) (dx2, dy2) (extra?, dy3)
                            const extra = (isLast && hasExtra) ? stack[j + 4] : 0;
                            curveTo(stack[j], 0, stack[j+1], stack[j+2], extra, stack[j+3]);
                            j += 4 + (isLast && hasExtra ? 1 : 0);
                        } else {
                            // vertical start: (0, dy1) (dx2, dy2) (dx3, extra?)
                            const extra = (isLast && hasExtra) ? stack[j + 4] : 0;
                            curveTo(0, stack[j], stack[j+1], stack[j+2], stack[j+3], extra);
                            j += 4 + (isLast && hasExtra ? 1 : 0);
                        }
                        phase = 1 - phase;
                    }
                    stack.length = 0;
                    break;
                }
                case 10: // callsubr (local)
                {
                    const idx = stack.pop() + localBias;
                    if (localSubrs && localSubrs.data[idx]) {
                        // Push current position to call stack
                        callStack.push({ data, i });
                        // Jump to subroutine (stack is shared!)
                        data = localSubrs.data[idx];
                        i = 0;
                    }
                    break;
                }
                case 29: // callgsubr (global)
                {
                    const idx = stack.pop() + globalBias;
                    if (globalSubrs && globalSubrs.data[idx]) {
                        callStack.push({ data, i });
                        data = globalSubrs.data[idx];
                        i = 0;
                    }
                    break;
                }
                case 11: // return
                {
                    if (callStack.length > 0) {
                        const ret = callStack.pop();
                        data = ret.data;
                        i = ret.i;
                    }
                    break;
                }
                case 14: // endchar
                {
                    if (!haveWidth && stack.length > 0) {
                        width = nominalWidthX + stack.shift();
                        haveWidth = true;
                    }
                    if (open) path.push({ type: 'close' });
                    open = false;
                    ended = true;
                    break;
                }
                case 15: // vsindex (CFF2: switch ItemVariationData - ignore for default instance)
                    stack.pop();
                    break;
                case 16: // blend (CFF2: variable font interpolation - use default values)
                {
                    const n = stack.pop();
                    // Remove n*numRegions delta values, keep n base operands
                    if (numRegions > 0 && n > 0) {
                        const deltasCount = n * numRegions;
                        // Deltas sit on top of the base operands
                        stack.splice(stack.length - deltasCount, deltasCount);
                    }
                    break;
                }
                default:
                    stack.length = 0;
                    break;
            }
        }

        if (open) path.push({ type: 'close' });
        return { path, width };
    }

    // Convert CFF path to command string
    function cffPathToCommands(pathData) {
        const commands = [];
        for (const cmd of pathData) {
            switch (cmd.type) {
                case 'move':
                    commands.push(`m ${cmd.x} ${cmd.y}`);
                    break;
                case 'line':
                    commands.push(`l ${cmd.x} ${cmd.y}`);
                    break;
                case 'cubic':
                    commands.push(`b ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`);
                    break;
                case 'close':
                    break;
            }
        }
        return commands.join(' ');
    }

    // =========================================================================
    // Main parse function
    // =========================================================================
    function parse(arrayBuffer, options = {}) {
        // Auto-detect and unwrap WOFF/WOFF2 containers
        const unwrapped = detectAndUnwrap(arrayBuffer);
        const reader = new DataReader(unwrapped);
        const dir = parseTableDirectory(reader);
        const tables = dir.tables;

        // Determine font type
        const isCFF = !!tables['CFF '];
        const isCFF2 = !!tables['CFF2'];
        const isTrueType = !!tables['glyf'];

        if (!isCFF && !isCFF2 && !isTrueType) {
            throw new Error('Unsupported font format: neither TrueType nor CFF/CFF2 outlines found.');
        }

        // Parse common tables
        const head = parseHead(reader, tables['head']);
        const maxp = parseMaxp(reader, tables['maxp']);
        const hhea = parseHhea(reader, tables['hhea']);
        const hmtx = parseHmtx(reader, tables['hmtx'], hhea.numberOfHMetrics, maxp.numGlyphs);
        const nameTable = parseName(reader, tables['name']);
        const os2 = parseOS2(reader, tables['OS/2']);
        const post = tables['post'] ? parsePost(reader, tables['post']) : { underlinePosition: -100, underlineThickness: 50 };
        const cmap = parseCmap(reader, tables['cmap']);

        // Parse kerning (try GPOS first, then kern)
        let kernPairsGID = {};
        try {
            if (tables['GPOS']) {
                kernPairsGID = parseGPOS(reader, tables['GPOS']);
            }
            if (tables['kern'] && Object.keys(kernPairsGID).length === 0) {
                kernPairsGID = parseKern(reader, tables['kern']);
            }
        } catch (e) { /* ignore kerning parse failures */ }

        // Build reverse cmap (glyph ID → char code) for kerning
        const gidToChar = {};
        for (const [code, gid] of Object.entries(cmap)) {
            if (!gidToChar[gid]) gidToChar[gid] = String.fromCodePoint(Number(code));
        }

        const unitsPerEm = head.unitsPerEm;
        const ascender = os2 ? os2.sTypoAscender : hhea.ascender;
        const descender = os2 ? os2.sTypoDescender : hhea.descender;

        // Filter characters to convert
        let charCodes;
        if (options.characters) {
            // Specific characters requested
            const chars = new Set();
            for (const ch of options.characters) {
                chars.add(ch.codePointAt(0));
            }
            charCodes = Array.from(chars).filter(c => cmap[c] !== undefined);
        } else if (options.restrictCharSet !== false) {
            // Default: convert all mapped characters
            charCodes = Object.keys(cmap).map(Number);
        }

        // Build glyphs
        let glyphOutlines;
        let cffData;
        let _glyfOffset = 0;
        let _locaOffsets = null;

        if (isTrueType) {
            _locaOffsets = parseLoca(reader, tables['loca'], maxp.numGlyphs, head.indexToLocFormat);
            _glyfOffset = tables['glyf'].offset;
            // parseGlyfTable は中で全グリフを事前パースしないようになった（V1.1）。
            // 戻り値は空グリフを除いて null で埋まり、参照時に parseGlyph で解決する。
            glyphOutlines = parseGlyfTable(reader, tables['glyf'], _locaOffsets, maxp.numGlyphs);
        } else if (isCFF2) {
            cffData = parseCFF(reader, tables['CFF2'], true);
        } else {
            cffData = parseCFF(reader, tables['CFF '], false);
        }

        // Build typeface JSON
        const glyphs = {};
        let convertedCount = 0;
        let errorCount = 0;

        for (const charCode of charCodes) {
            const glyphId = cmap[charCode];
            if (glyphId === undefined || glyphId === 0) continue;

            const char = String.fromCodePoint(charCode);
            const advanceWidth = hmtx[glyphId] ? hmtx[glyphId].advanceWidth : 0;

            // CFF/CFF2 は executeCharString が重く、フォント全グリフ（数千個）を
            // パース時に展開すると OTF 読み込みで UI が数秒凍結する。
            // → CFF 系は実際に glyph.o が参照された瞬間に評価する遅延ゲッターを用いる。
            if (!isTrueType && cffData && glyphId < cffData.charStringsIndex.data.length) {
                const _charString = cffData.charStringsIndex.data[glyphId];
                let _fdIdx = 0;
                if (cffData.isCID && cffData.fdSelect) {
                    _fdIdx = cffData.fdSelect[glyphId] || 0;
                }
                const _localSubrs = cffData.localSubrIndices[_fdIdx];
                const _dwx = cffData.isCFF2 ? 0 : (cffData.defaultWidthX[_fdIdx] || 0);
                const _nwx = cffData.isCFF2 ? 0 : (cffData.nominalWidthX[_fdIdx] || 0);
                const _numR = cffData.numRegions || 0;
                const _globSubr = cffData.globalSubrIndex;

                const lazyGlyph = { ha: advanceWidth };
                Object.defineProperty(lazyGlyph, 'o', {
                    configurable: true,
                    enumerable: true,
                    get() {
                        let path = '';
                        try {
                            const result = executeCharString(_charString, _globSubr, _localSubrs, _dwx, _nwx, _numR);
                            path = cffPathToCommands(result.path);
                        } catch (e) {
                            path = '';
                        }
                        Object.defineProperty(this, 'o', {
                            value: path,
                            writable: true,
                            enumerable: true,
                            configurable: true
                        });
                        return path;
                    }
                });
                glyphs[char] = lazyGlyph;
                convertedCount++;
                continue;
            }

            // TrueType も日本語フォント (numGlyphs > 10000) で読み込みフリーズの主因となる。
            // → glyf table の事前展開を撤廃し、ttContourToCommands も参照時まで遅延。
            if (isTrueType && glyphOutlines && glyphId < glyphOutlines.length) {
                const _gid = glyphId;
                const _r = reader;
                const _go = _glyfOffset;
                const _lo = _locaOffsets;
                const _cache = glyphOutlines;

                const lazyGlyph = { ha: advanceWidth };
                Object.defineProperty(lazyGlyph, 'o', {
                    configurable: true,
                    enumerable: true,
                    get() {
                        let path = '';
                        try {
                            let g = _cache[_gid];
                            if (!g || g.contours === undefined) {
                                g = parseGlyph(_r, _go, _lo, _gid, _cache);
                                _cache[_gid] = g;
                            }
                            if (g && g.contours && g.contours.length > 0) {
                                const parts = [];
                                for (const contour of g.contours) {
                                    const cmd = ttContourToCommands(contour);
                                    if (cmd) parts.push(cmd);
                                }
                                path = parts.join(' ');
                            }
                        } catch (e) {
                            path = '';
                        }
                        Object.defineProperty(this, 'o', {
                            value: path,
                            writable: true,
                            enumerable: true,
                            configurable: true
                        });
                        return path;
                    }
                });
                glyphs[char] = lazyGlyph;
                convertedCount++;
                continue;
            }

            // どちらの形式でもない／glyphId が範囲外の場合のフォールバック
            glyphs[char] = { ha: advanceWidth, o: '' };
        }

        // Build kerning map (char → char → value)
        const kerning = {};
        for (const [gid1Str, gid1Pairs] of Object.entries(kernPairsGID)) {
            const ch1 = gidToChar[gid1Str];
            if (!ch1 || !glyphs[ch1]) continue;
            for (const [gid2Str, value] of Object.entries(gid1Pairs)) {
                const ch2 = gidToChar[gid2Str];
                if (!ch2 || !glyphs[ch2]) continue;
                if (!kerning[ch1]) kerning[ch1] = {};
                kerning[ch1][ch2] = value;
            }
        }

        const formatStr = isCFF2 ? 'CFF2/OTF' : (isCFF ? 'CFF/OTF' : 'TrueType');

        const result = {
            glyphs: glyphs,
            familyName: nameTable.fontFamily || nameTable.fullName || 'Unknown',
            ascender: ascender,
            descender: descender,
            underlinePosition: post.underlinePosition || Math.round(-unitsPerEm * 0.1),
            underlineThickness: post.underlineThickness || Math.round(unitsPerEm * 0.05),
            boundingBox: {
                xMin: head.xMin,
                yMin: head.yMin,
                xMax: head.xMax,
                yMax: head.yMax
            },
            resolution: unitsPerEm,
            kerning: kerning,
            original_font_information: {
                format: formatStr,
                fontFamily: nameTable.fontFamily,
                fontSubfamily: nameTable.fontSubfamily,
                fullName: nameTable.fullName,
                postScriptName: nameTable.postScriptName,
                version: nameTable.version,
                copyright: nameTable.copyright,
                designer: nameTable.designer
            },
            _meta: {
                convertedGlyphs: convertedCount,
                errorGlyphs: errorCount,
                totalMapped: charCodes.length,
                type: formatStr,
                // Phase 11: fvar テーブル軸情報を実際にパース
                variableAxes: parseFvarAxes(reader, tables['fvar']),
                // Phase 13-A: HarfBuzz が利用可能な場合に shape 用に元 ArrayBuffer を保持。
                // createTextShapes(options.fontBuffer 未指定) でも自動的に shape できる。
                // メモリ的には font 読込済の間だけ保持されるので大きな悪影響なし。
                sourceBuffer: arrayBuffer
            }
        };

        return result;
    }

    // =========================================================================
    // Debug: Convert typeface glyph path to SVG path data (for verification)
    // =========================================================================
    function glyphToSVGPath(glyphObj, scale) {
        if (!glyphObj || !glyphObj.o) return '';
        const tokens = glyphObj.o.split(' ');
        const s = scale || 1;
        let d = '';
        let i = 0;
        let firstInContour = true;
        while (i < tokens.length) {
            const cmd = tokens[i++];
            switch (cmd) {
                case 'm': {
                    if (!firstInContour) d += 'Z ';
                    const x = parseFloat(tokens[i++]) * s;
                    const y = parseFloat(tokens[i++]) * s;
                    d += `M ${x} ${-y} `;
                    firstInContour = false;
                    break;
                }
                case 'l': {
                    const x = parseFloat(tokens[i++]) * s;
                    const y = parseFloat(tokens[i++]) * s;
                    d += `L ${x} ${-y} `;
                    break;
                }
                case 'q': {
                    const cx = parseFloat(tokens[i++]) * s;
                    const cy = parseFloat(tokens[i++]) * s;
                    const x = parseFloat(tokens[i++]) * s;
                    const y = parseFloat(tokens[i++]) * s;
                    d += `Q ${cx} ${-cy} ${x} ${-y} `;
                    break;
                }
                case 'b': {
                    const c1x = parseFloat(tokens[i++]) * s;
                    const c1y = parseFloat(tokens[i++]) * s;
                    const c2x = parseFloat(tokens[i++]) * s;
                    const c2y = parseFloat(tokens[i++]) * s;
                    const x = parseFloat(tokens[i++]) * s;
                    const y = parseFloat(tokens[i++]) * s;
                    d += `C ${c1x} ${-c1y} ${c2x} ${-c2y} ${x} ${-y} `;
                    break;
                }
                default:
                    break;
            }
        }
        d += 'Z';
        return d;
    }

    function generateSVG(typefaceJSON, text, fontSize) {
        fontSize = fontSize || 120;
        const res = typefaceJSON.resolution || 1000;
        const scale = fontSize / res;
        const glyphs = typefaceJSON.glyphs;
        const kerning = typefaceJSON.kerning || {};
        let paths = '';
        let xOffset = 10;
        const baseline = fontSize * 1.1;
        const chars = [...text];

        for (let ci = 0; ci < chars.length; ci++) {
            const ch = chars[ci];
            const g = glyphs[ch];
            if (!g) { xOffset += res * 0.3 * scale; continue; }
            if (g.o) {
                const svgPath = glyphToSVGPath(g, scale);
                paths += `<path d="${svgPath}" transform="translate(${xOffset},${baseline})" fill="black" fill-rule="nonzero" />\n`;
            }
            xOffset += g.ha * scale;
            // Apply kerning
            if (ci + 1 < chars.length && kerning[ch]) {
                const kern = kerning[ch][chars[ci + 1]];
                if (kern) xOffset += kern * scale;
            }
        }

        const width = Math.ceil(xOffset + 20);
        const height = Math.ceil(fontSize * 1.6);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="white"/>
${paths}</svg>`;
    }

    // =========================================================================
    // Three.js Shape Builder - bypasses TextGeometry's broken winding detection
    // =========================================================================
    // Three.js's Font/ShapePath.toShapes() uses only 12 divisions for area
    // calculation, causing winding direction detection to fail on complex CFF
    // cubic bezier paths. This implementation uses high-quality tessellation
    // and proper point-in-polygon testing for hole assignment.
    //
    // Usage:
    //   const shapes = FontEngine3D.createTextShapes(THREE, json, 'Hello', {
    //       size: 80, curveSegments: 48, reverseWinding: false
    //   });
    //   const geometry = new THREE.ExtrudeGeometry(shapes, { depth: 15, curveSegments: 48 });
    // =========================================================================

    // Per-glyph subpath cache: WeakMap<glyphObj, Map<"scale|divisions|rev", computedSubpaths>>
    // computedSubpaths は offsetX=0・THREE非依存の純データ（{outers: [{pts, holes:[{pts}]}]}）。
    // キャッシュヒット時はテッセレーションをスキップし、offsetX を加算しながら THREE.Shape を組むだけで済む。
    const _glyphSubpathCache = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;

    // Phase 10-B5: グリフキャッシュ統計 (ヒット/ミス回数とおおよそのサイズ)
    // WeakMap はサイズを直接読めないため、glyph オブジェクトをキーに別途
    // Set 風カウンタを保持する。漏れる可能性はあるが概算として十分。
    let _cacheHits = 0;
    let _cacheMisses = 0;
    const _trackedGlyphs = (typeof Set !== 'undefined') ? new Set() : null;

    function createTextShapes(THREE, typefaceJSON, text, options) {
        options = options || {};
        const size = options.size || 80;
        const divisions = options.curveSegments || 48;
        const reverseWinding = !!options.reverseWinding;
        const data = typefaceJSON;
        const scale = size / (data.resolution || 1000);
        let offsetX = 0;
        const allShapes = [];
        const kerning = data.kerning || {};
        const chars = [...text];

        // Phase 12-B: HarfBuzz WASM が利用可能で、shaping を要求された場合は
        // shape 結果 (glyph IDs + advances + offsets) で文字配置を上書きする。
        // 利用条件:
        //   - options.useShaping === true (or default if window._harfbuzzInstance set)
        //   - options.fontBuffer (生 ArrayBuffer / .ttf or .otf)
        //   - window._harfbuzzInstance がセットされている
        // shape できなければ通常の単純レイアウトに fallback。
        let shaped = null;
        const wantShaping = options.useShaping !== false; // デフォルト ON
        // Phase 13-A: options.fontBuffer 未指定なら parse 時に保持された sourceBuffer を自動使用
        const fontBuf = options.fontBuffer || (data && data._meta && data._meta.sourceBuffer) || null;
        if (wantShaping && fontBuf && typeof window !== 'undefined' && window._harfbuzzInstance) {
            try { shaped = shapeText(typefaceJSON, text, fontBuf); } catch (e) { shaped = null; }
        }
        if (shaped && Array.isArray(shaped) && shaped.length > 0) {
            // HarfBuzz は glyph ID ベースで結果を返す。typefaceJSON は char → glyph の
            // マップしか持たないので、代わりに shape の x_advance / x_offset を使い、
            // text の char 列とインデックス対応で配置する (近似で十分なケースが大半)。
            for (let i = 0; i < shaped.length; i++) {
                const g = shaped[i];
                const ch = chars[i] != null ? chars[i] : null;
                if (ch === null || ch === '\n') { offsetX = 0; continue; }
                const glyph = data.glyphs[ch];
                const xOff = (g.dx || 0) * scale;
                const yOff = (g.dy || 0) * scale;
                if (glyph && glyph.o) {
                    const computed = _getCachedGlyphSubpaths(glyph, scale, divisions, reverseWinding);
                    if (computed && computed.outers.length > 0) {
                        const shapesG = _buildShapesAtOffset(THREE, computed, offsetX + xOff, yOff);
                        allShapes.push(...shapesG);
                    }
                }
                // HarfBuzz の x_advance を信頼 (1/64 unit → unit に正規化)
                const adv = (g.ax != null) ? g.ax / 64 : (glyph ? (glyph.ha || 0) : (data.resolution || 1000) * 0.3);
                offsetX += adv * scale;
            }
            return allShapes;
        }

        for (let ci = 0; ci < chars.length; ci++) {
            const char = chars[ci];
            if (char === '\n') { offsetX = 0; continue; }
            const glyph = data.glyphs[char];
            if (!glyph) {
                offsetX += (data.resolution || 1000) * scale * 0.3;
                continue;
            }

            if (glyph.o) {
                const computed = _getCachedGlyphSubpaths(glyph, scale, divisions, reverseWinding);
                if (computed && computed.outers.length > 0) {
                    const shapes = _buildShapesAtOffset(THREE, computed, offsetX);
                    allShapes.push(...shapes);
                }
            }

            offsetX += (glyph.ha || 0) * scale;

            // Apply kerning
            if (ci + 1 < chars.length && kerning[char]) {
                const nextChar = chars[ci + 1];
                const kern = kerning[char][nextChar];
                if (kern) offsetX += kern * scale;
            }
        }

        return allShapes;
    }

    function _getCachedGlyphSubpaths(glyph, scale, divisions, reverseWinding) {
        const key = scale + '|' + divisions + '|' + (reverseWinding ? 1 : 0);
        if (_glyphSubpathCache) {
            let perGlyph = _glyphSubpathCache.get(glyph);
            if (perGlyph) {
                const hit = perGlyph.get(key);
                if (hit) { _cacheHits++; return hit; }
            } else {
                perGlyph = new Map();
                _glyphSubpathCache.set(glyph, perGlyph);
                if (_trackedGlyphs) _trackedGlyphs.add(glyph);
            }
            _cacheMisses++;
            const computed = _computeGlyphSubpaths(glyph.o, scale, divisions, reverseWinding);
            perGlyph.set(key, computed);
            return computed;
        }
        _cacheMisses++;
        return _computeGlyphSubpaths(glyph.o, scale, divisions, reverseWinding);
    }

    // Phase 10-B5: キャッシュ統計を返す
    function cacheStats() {
        return {
            size: _trackedGlyphs ? _trackedGlyphs.size : 0,
            hits: _cacheHits,
            misses: _cacheMisses
        };
    }

    // 純データ（THREE非依存・offsetX=0）の subpath 計算。
    // 戻り値: { outers: [ { pts: [{x,y}...], holes: [ { pts: [{x,y}...] } ... ] } ... ] }
    function _computeGlyphSubpaths(pathStr, scale, divisions, reverseWinding) {
        const subPaths = _parsePathString(pathStr, scale);
        if (subPaths.length === 0) return { outers: [] };

        // 旧: areaDiv = max(divisions, 48) で常時48分割していた。
        // 漢字グリフは subPaths が30〜50個におよび、48分割×全curve で
        // 1グリフあたり数千頂点 → ExtrudeGeometry / CSG 双方が重くなる主因だった。
        // 24分割でも符号検出と穴判定は実用上問題なく、トライアングル数を約半減できる。
        const areaDiv = Math.max(divisions, 24);
        const subPathData = subPaths.map(sp => {
            const pts = _tessellate(sp, areaDiv);
            const area = _signedArea(pts);
            return { pts, area };
        });

        let largestIdx = 0, largestArea = 0;
        for (let j = 0; j < subPathData.length; j++) {
            if (Math.abs(subPathData[j].area) > largestArea) {
                largestArea = Math.abs(subPathData[j].area);
                largestIdx = j;
            }
        }

        const outerSign = Math.sign(subPathData[largestIdx].area);
        for (const d of subPathData) {
            d.isOuter = (Math.sign(d.area) === outerSign) || (d.area === 0);
            if (reverseWinding) d.isOuter = !d.isOuter;
        }

        const outers = [];
        const holes = [];
        for (const d of subPathData) {
            if (d.isOuter) outers.push({ pts: d.pts, area: d.area, holes: [] });
            else holes.push(d);
        }

        for (const hole of holes) {
            if (hole.pts.length === 0) continue;
            const testPt = hole.pts[0];
            let bestOuter = null, bestArea = Infinity;
            for (const outer of outers) {
                if (_isPointInPolygon(testPt, outer.pts)) {
                    const absArea = Math.abs(outer.area);
                    if (absArea < bestArea) { bestArea = absArea; bestOuter = outer; }
                }
            }
            if (bestOuter) bestOuter.holes.push({ pts: hole.pts });
            else if (outers.length > 0) outers[0].holes.push({ pts: hole.pts });
        }

        return { outers };
    }

    // 計算済み subpath から、指定 offsetX を加算しつつ THREE.Shape の配列を組み立てる。
    // テッセレーションは行わないので軽量。
    // Phase 12-B: HarfBuzz の glyph offset (y 方向) もサポートする2引数版。
    // 旧呼出は offsetY=0 として動作するので互換維持。
    function _buildShapesAtOffset(THREE, computed, offsetX, offsetY) {
        offsetY = offsetY || 0;
        const result = [];
        for (const outer of computed.outers) {
            const shape = new THREE.Shape();
            const pts = outer.pts;
            if (pts.length === 0) continue;
            shape.moveTo(pts[0].x + offsetX, pts[0].y + offsetY);
            for (let j = 1; j < pts.length; j++) shape.lineTo(pts[j].x + offsetX, pts[j].y + offsetY);
            for (const hole of outer.holes) {
                const path = new THREE.Path();
                const hp = hole.pts;
                if (hp.length === 0) continue;
                path.moveTo(hp[0].x + offsetX, hp[0].y + offsetY);
                for (let j = 1; j < hp.length; j++) path.lineTo(hp[j].x + offsetX, hp[j].y + offsetY);
                shape.holes.push(path);
            }
            result.push(shape);
        }
        return result;
    }

    function _parsePathString(pathStr, scale) {
        const tokens = pathStr.split(' ');
        const subPaths = [];
        let current = null;
        let i = 0;
        while (i < tokens.length) {
            const cmd = tokens[i];
            switch (cmd) {
                case 'm': {
                    current = [];
                    subPaths.push(current);
                    const x = parseFloat(tokens[i+1]) * scale;
                    const y = parseFloat(tokens[i+2]) * scale;
                    current.push({ type: 'move', x, y });
                    i += 3;
                    break;
                }
                case 'l': {
                    const x = parseFloat(tokens[i+1]) * scale;
                    const y = parseFloat(tokens[i+2]) * scale;
                    if (current) current.push({ type: 'line', x, y });
                    i += 3;
                    break;
                }
                case 'q': {
                    const cpx = parseFloat(tokens[i+1]) * scale;
                    const cpy = parseFloat(tokens[i+2]) * scale;
                    const x   = parseFloat(tokens[i+3]) * scale;
                    const y   = parseFloat(tokens[i+4]) * scale;
                    if (current) current.push({ type: 'quad', cpx, cpy, x, y });
                    i += 5;
                    break;
                }
                case 'b': {
                    const cp1x = parseFloat(tokens[i+1]) * scale;
                    const cp1y = parseFloat(tokens[i+2]) * scale;
                    const cp2x = parseFloat(tokens[i+3]) * scale;
                    const cp2y = parseFloat(tokens[i+4]) * scale;
                    const x    = parseFloat(tokens[i+5]) * scale;
                    const y    = parseFloat(tokens[i+6]) * scale;
                    if (current) current.push({ type: 'cubic', cp1x, cp1y, cp2x, cp2y, x, y });
                    i += 7;
                    break;
                }
                default:
                    i++;
            }
        }
        return subPaths;
    }

    function _tessellate(sp, divs) {
        const pts = [];
        if (sp.length === 0) return pts;
        let cx = sp[0].x, cy = sp[0].y;
        pts.push({ x: cx, y: cy });
        for (let j = 1; j < sp.length; j++) {
            const cmd = sp[j];
            switch (cmd.type) {
                case 'line':
                    pts.push({ x: cmd.x, y: cmd.y });
                    cx = cmd.x; cy = cmd.y;
                    break;
                case 'quad':
                    for (let t = 1; t <= divs; t++) {
                        const u = t / divs, inv = 1 - u;
                        pts.push({
                            x: inv*inv*cx + 2*inv*u*cmd.cpx + u*u*cmd.x,
                            y: inv*inv*cy + 2*inv*u*cmd.cpy + u*u*cmd.y
                        });
                    }
                    cx = cmd.x; cy = cmd.y;
                    break;
                case 'cubic':
                    for (let t = 1; t <= divs; t++) {
                        const u = t / divs, inv = 1 - u;
                        pts.push({
                            x: inv*inv*inv*cx + 3*inv*inv*u*cmd.cp1x + 3*inv*u*u*cmd.cp2x + u*u*u*cmd.x,
                            y: inv*inv*inv*cy + 3*inv*inv*u*cmd.cp1y + 3*inv*u*u*cmd.cp2y + u*u*u*cmd.y
                        });
                    }
                    cx = cmd.x; cy = cmd.y;
                    break;
            }
        }
        return pts;
    }

    function _signedArea(pts) {
        let area = 0;
        for (let j = 0, n = pts.length; j < n; j++) {
            const p1 = pts[j], p2 = pts[(j + 1) % n];
            area += (p1.x * p2.y - p2.x * p1.y);
        }
        return area / 2;
    }

    function _isPointInPolygon(pt, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            if (((yi > pt.y) !== (yj > pt.y)) &&
                (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    // =========================================================================
    // Phase 10-B1: フォント診断
    // typeface JSON に含まれる主要メタデータをまとめて返す。
    // missingGlyphs は ASCII printable + 数字を念のためチェックする軽量サンプル。
    // =========================================================================
    function diagnose(typefaceJSON) {
        const result = {
            glyphCount: 0,
            hasKerning: false,
            kerningPairs: 0,
            hasComposite: false,
            missingGlyphs: [],
            format: 'unknown'
        };
        if (!typefaceJSON || !typefaceJSON.glyphs) return result;

        const glyphs = typefaceJSON.glyphs;
        result.glyphCount = Object.keys(glyphs).length;

        // 形式
        if (typefaceJSON._meta && typefaceJSON._meta.type) {
            result.format = typefaceJSON._meta.type;
        } else if (typefaceJSON.original_font_information && typefaceJSON.original_font_information.format) {
            result.format = typefaceJSON.original_font_information.format;
        }

        // カーニング
        const kerning = typefaceJSON.kerning;
        if (kerning && typeof kerning === 'object') {
            const keys = Object.keys(kerning);
            if (keys.length > 0) {
                result.hasKerning = true;
                let pairs = 0;
                for (const k of keys) {
                    const sub = kerning[k];
                    if (sub && typeof sub === 'object') pairs += Object.keys(sub).length;
                }
                result.kerningPairs = pairs;
            }
        }

        // composite glyph: 2dfont engine では composite を unrolled してから保存しているが、
        // 元データに痕跡が残っているかをチェック (パスが空 + ha があるなど)
        for (const ch in glyphs) {
            const g = glyphs[ch];
            if (g && g._composite) { result.hasComposite = true; break; }
        }

        // missingGlyphs: ASCII printable のごく一部をサンプルチェック
        const sample = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (const ch of sample) {
            if (!glyphs[ch]) result.missingGlyphs.push(ch);
        }

        return result;
    }

    // =========================================================================
    // Phase 10-B2: アウトラインクリーンアップ (内部ヘルパー)
    // 一部のスキャン由来フォントには「影スペック」と呼ばれる極小サブパスや
    // 重複点が混じることがある。それらを取り除いた path 文字列を返す。
    // - 連続する近接点 (1e-3未満) を1つに統合
    // - 3点未満のサブパスを破棄
    // - bbox面積 < opts.minArea のサブパスを破棄 (デフォ 0.5)
    // 入力フォーマットは typeface.glyphs[c].o と同じ (m/l/q/b スペース区切り)。
    // =========================================================================
    function _cleanupOutline(pathStr, opts) {
        opts = opts || {};
        const eps = (typeof opts.epsilon === 'number') ? opts.epsilon : 1e-3;
        const minArea = (typeof opts.minArea === 'number') ? opts.minArea : 0.5;
        if (typeof pathStr !== 'string' || pathStr.length === 0) return '';

        // サブパスごとにトークン群に切り分ける
        const tokens = pathStr.split(' ').filter(t => t.length > 0);
        const subPaths = [];
        let current = null;
        let i = 0;
        let cx = 0, cy = 0;
        while (i < tokens.length) {
            const cmd = tokens[i];
            if (cmd === 'm') {
                const x = parseFloat(tokens[i+1]);
                const y = parseFloat(tokens[i+2]);
                current = { commands: [{ type: 'm', x, y }], pts: [{ x, y }],
                            xMin: x, yMin: y, xMax: x, yMax: y };
                subPaths.push(current);
                cx = x; cy = y;
                i += 3;
            } else if (cmd === 'l') {
                const x = parseFloat(tokens[i+1]);
                const y = parseFloat(tokens[i+2]);
                if (current) {
                    const last = current.pts[current.pts.length - 1];
                    if (Math.abs(last.x - x) > eps || Math.abs(last.y - y) > eps) {
                        current.commands.push({ type: 'l', x, y });
                        current.pts.push({ x, y });
                        if (x < current.xMin) current.xMin = x;
                        if (y < current.yMin) current.yMin = y;
                        if (x > current.xMax) current.xMax = x;
                        if (y > current.yMax) current.yMax = y;
                    }
                }
                cx = x; cy = y;
                i += 3;
            } else if (cmd === 'q') {
                const cpx = parseFloat(tokens[i+1]);
                const cpy = parseFloat(tokens[i+2]);
                const x   = parseFloat(tokens[i+3]);
                const y   = parseFloat(tokens[i+4]);
                if (current) {
                    current.commands.push({ type: 'q', cpx, cpy, x, y });
                    current.pts.push({ x, y });
                    if (x < current.xMin) current.xMin = x;
                    if (y < current.yMin) current.yMin = y;
                    if (x > current.xMax) current.xMax = x;
                    if (y > current.yMax) current.yMax = y;
                }
                cx = x; cy = y;
                i += 5;
            } else if (cmd === 'b') {
                const c1x = parseFloat(tokens[i+1]);
                const c1y = parseFloat(tokens[i+2]);
                const c2x = parseFloat(tokens[i+3]);
                const c2y = parseFloat(tokens[i+4]);
                const x   = parseFloat(tokens[i+5]);
                const y   = parseFloat(tokens[i+6]);
                if (current) {
                    current.commands.push({ type: 'b', c1x, c1y, c2x, c2y, x, y });
                    current.pts.push({ x, y });
                    if (x < current.xMin) current.xMin = x;
                    if (y < current.yMin) current.yMin = y;
                    if (x > current.xMax) current.xMax = x;
                    if (y > current.yMax) current.yMax = y;
                }
                cx = x; cy = y;
                i += 7;
            } else {
                i++;
            }
        }

        // フィルタ: 3点未満 / bbox面積過小
        const out = [];
        for (const sp of subPaths) {
            if (sp.pts.length < 3) continue;
            const w = sp.xMax - sp.xMin;
            const h = sp.yMax - sp.yMin;
            if (w * h < minArea) continue;
            for (const c of sp.commands) {
                if (c.type === 'm')      out.push('m', c.x, c.y);
                else if (c.type === 'l') out.push('l', c.x, c.y);
                else if (c.type === 'q') out.push('q', c.cpx, c.cpy, c.x, c.y);
                else if (c.type === 'b') out.push('b', c.c1x, c.c1y, c.c2x, c.c2y, c.x, c.y);
            }
        }
        return out.join(' ');
    }

    // =========================================================================
    // Phase 10-B4: 複数行レイアウト
    // text を改行で分割して各行のメトリクス (行幅・行高・ベースラインY) を返す。
    // 実際のシェイプ構築は行わない (呼び出し側が createTextShapes を別途使う想定)。
    // 戻り値: { lines: [{line, width, height, baselineY}], lineHeight, totalHeight }
    // - lineHeight = (ascender - descender) * scale * (options.lineSpacing || 1.2)
    // - 1行目の baselineY は 0、2行目以降は -lineHeight ずつ下る (THREE座標系: Y上)
    // =========================================================================
    function layoutMultiline(typefaceJSON, text, options) {
        options = options || {};
        const size = options.size || 80;
        const data = typefaceJSON || {};
        const res = data.resolution || 1000;
        const scale = size / res;
        const ascender  = (typeof data.ascender  === 'number') ? data.ascender  : res * 0.8;
        const descender = (typeof data.descender === 'number') ? data.descender : -res * 0.2;
        const lineSpacing = (typeof options.lineSpacing === 'number') ? options.lineSpacing : 1.2;
        const lineHeight = (ascender - descender) * scale * lineSpacing;
        const glyphHeight = (ascender - descender) * scale;

        const kerning = data.kerning || {};
        const glyphs  = data.glyphs  || {};
        const linesRaw = String(text == null ? '' : text).split('\n');
        const lines = [];

        for (let li = 0; li < linesRaw.length; li++) {
            const line = linesRaw[li];
            const chars = [...line];
            let width = 0;
            for (let ci = 0; ci < chars.length; ci++) {
                const ch = chars[ci];
                const g = glyphs[ch];
                if (!g) {
                    width += res * 0.3 * scale;
                    continue;
                }
                width += (g.ha || 0) * scale;
                if (ci + 1 < chars.length && kerning[ch]) {
                    const k = kerning[ch][chars[ci + 1]];
                    if (k) width += k * scale;
                }
            }
            lines.push({
                line,
                width,
                height: glyphHeight,
                baselineY: -li * lineHeight
            });
        }

        return {
            lines,
            lineHeight,
            totalHeight: linesRaw.length > 0 ? (linesRaw.length - 1) * lineHeight + glyphHeight : 0
        };
    }

    // Public API
    return { parse, createTextShapes, glyphToSVGPath, generateSVG,
             diagnose, layoutMultiline, cacheStats, _cleanupOutline,
             shapeText };

})();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FontEngine3D;
}
if (typeof window !== 'undefined') {
    window.FontEngine3D = FontEngine3D;
}

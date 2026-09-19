import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export function cleanupGeometry(geometry) {
    if (!geometry) return null;

    let geo = geometry.clone();
    if (geo.index) geo = geo.toNonIndexed();
    geo = BufferGeometryUtils.mergeVertices(geo, 0.0001);
    geo.computeVertexNormals();

    return geo;
}

export function repairMesh(geometry) {
    if (!geometry) return null;

    let geo = geometry;
    if (geo.index) geo = geo.toNonIndexed();

    const position = geo.attributes.position;
    const epsilon = 0.0001;
    const triangles = [];

    for (let i = 0; i < position.count; i += 3) {
        const v0 = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i));
        const v1 = new THREE.Vector3(position.getX(i + 1), position.getY(i + 1), position.getZ(i + 1));
        const v2 = new THREE.Vector3(position.getX(i + 2), position.getY(i + 2), position.getZ(i + 2));

        const edge1 = new THREE.Vector3().subVectors(v1, v0);
        const edge2 = new THREE.Vector3().subVectors(v2, v0);
        const cross = new THREE.Vector3().crossVectors(edge1, edge2);
        const area = cross.length() / 2;

        if (area < epsilon) continue;
        if (v0.distanceTo(v1) < epsilon || v1.distanceTo(v2) < epsilon || v2.distanceTo(v0) < epsilon) continue;

        triangles.push({ v0, v1, v2, area });
    }

    const uniqueTriangles = [];
    const seen = new Set();

    for (const tri of triangles) {
        const cx = ((tri.v0.x + tri.v1.x + tri.v2.x) / 3).toFixed(3);
        const cy = ((tri.v0.y + tri.v1.y + tri.v2.y) / 3).toFixed(3);
        const cz = ((tri.v0.z + tri.v1.z + tri.v2.z) / 3).toFixed(3);
        const areaKey = tri.area.toFixed(4);
        const key = `${cx},${cy},${cz},${areaKey}`;

        if (!seen.has(key)) {
            seen.add(key);
            uniqueTriangles.push(tri);
        }
    }

    const newPositions = [];
    for (const tri of uniqueTriangles) {
        newPositions.push(tri.v0.x, tri.v0.y, tri.v0.z);
        newPositions.push(tri.v1.x, tri.v1.y, tri.v1.z);
        newPositions.push(tri.v2.x, tri.v2.y, tri.v2.z);
    }

    const newGeo = new THREE.BufferGeometry();
    newGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));

    const mergedGeo = BufferGeometryUtils.mergeVertices(newGeo, 0.0001);
    mergedGeo.computeVertexNormals();

    console.log(`Repair: ${position.count / 3} ->${uniqueTriangles.length} triangles`);

    return mergedGeo;
}

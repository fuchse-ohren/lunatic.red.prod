// フラグメントから「バケットID」「プライベートキー」「パス」を取得
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const ns = hashParams.get("ns");
const pk = hashParams.get("pk");
const path = hashParams.get("path");
const reg = hashParams.get("reg");

if (ns && pk && path && reg) {
  // ナビゲーションバーに表示
  document.getElementById('reg').innerText = reg;
  document.getElementById('ns').innerText = ns;
  document.getElementById('path').innerText = path;

  // ファイル一覧取得URLの生成
  const apiUrl = `https://${ns}.objectstorage.${reg}.oci.customer-oci.com/p/${pk}/n/${ns}/b/${path}/o/`;

  // ファイル一覧を取得
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error("ファイル一覧の取得に失敗しました");
      }
      return response.json();
    })
    .then(data => {
      const fileList = document.getElementById("file-list");

      // ファイル一覧を描写
      data.objects.forEach(file => {
		
		// div.col.s6.m3
		const col = document.createElement('div');
		col.className = 'col s6 m4 l3 xl2';
		
		// div.card
		const card = document.createElement('div');
		card.className = 'card';
		
		// div.card-image
		const cardImage = document.createElement('div');
		cardImage.className = 'card-image';
		
		// SVG
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute('height', '100%');
		svg.setAttribute('viewBox', '0 -960 960 960');
		svg.setAttribute('width', '100%');
		svg.setAttribute('fill', '#5f6368');
		
		const svgpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
		svgpath.setAttribute('d', 'M640-480v-80h80v80h-80Zm0 80h-80v-80h80v80Zm0 80v-80h80v80h-80ZM447-640l-80-80H160v480h400v-80h80v80h160v-400H640v80h-80v-80H447ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80v-480 480Z');
		
		svg.appendChild(svgpath);
		cardImage.appendChild(svg);
		
		// a.btn-floating
		const btn = document.createElement('a');
		btn.className = 'btn-floating halfway-fab waves-effect waves-light red';
		btn.href = `https://${ns}.objectstorage.${reg}.oci.customer-oci.com/p/${pk}/n/${ns}/b/${path}/o/${file.name}`;
		btn.download = file.name;
		
		const icon = document.createElement('i');
		icon.className = 'material-icons';
		icon.textContent = 'download';
		
		btn.appendChild(icon);
		cardImage.appendChild(btn);
		
		// div.card-content
		const cardContent = document.createElement('div');
		cardContent.className = 'card-content';
		cardContent.style.overflowWrap = 'break-word';
		
		// p.flow-text
		const p = document.createElement('p');
		p.className = 'flow-text';
		p.textContent = file.name;
		
		cardContent.appendChild(p);
		card.appendChild(cardImage);
		card.appendChild(cardContent);
		col.appendChild(card);
        fileList.appendChild(col);

      });
    })
    .catch(error => {
      console.error(error);
	  M.toast({html: 'ファイル一覧の取得に失敗しました'});
    });
} else {
	M.toast({html: 'ネームスペース，が指定されていません'});
}
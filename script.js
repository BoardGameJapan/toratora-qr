// based on:
//   https://qiita.com/tkyk0317/items/7d7f327cda48086f894f
//   https://qiita.com/Futo23/items/bff1ce1d2e1b219b243d
navigator.mediaDevices =
	navigator.mediaDevices ||
	((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
		getUserMedia:
			function(c) {
				return new Promise(function(y, n) {
					(navigator.mozGetUserMedia || navigator.webkitGetUserMedia).call(navigator, c, y, n);
				});
			}
	} : null);

var data = {
	status: '初期状態',
	p1status: '未読み取り',
	p2status: '未読み取り',
	p1char: 0,
	p2char: 0,
};
var app = new Vue({
	el: '#app',
	data: data,
});

var video = document.getElementById('video');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var localStream = null;
var w, h;

if (navigator.mediaDevices) {
	var constraints = { audio: false, video: { facingMode: "environment", width: 1280, height: 720 } };
	navigator.mediaDevices.getUserMedia(constraints)
		.then(function(stream) {
			// video.src = window.URL.createObjectURL(stream);
			video.srcObject = stream;
			localStream = stream;

			// videoの縦幅横幅を取得
			w = video.offsetWidth;
			h = video.offsetHeight;

			// 同じサイズをcanvasに指定
			canvas.setAttribute("width", w);
			canvas.setAttribute("height", h);
		})
		.catch(function(err) {
			data.status = err.name + ": " + err.message;
		});
} else {
	data.status = "getUserMedia() is not supported in your browser.";
}

const errmsg = "error decoding QR Code";

function decodeImageFromBase64promise(data)
{
	return new Promise(function(resolve, reject) {
		qrcode.callback = resolve;
		/* qrcode.callback = function(result) {
			if (result == errmsg) {
				// 本来はrejectすべきところのはず
				resolve(result);
			}
			resolve(result);
		}; */
		qrcode.decode(data);
	});
}

document.getElementById("action").addEventListener('click', async function() {
	if (localStream) {
		data.status = "Player1読み取り中";
		r = errmsg;
		for (i = 0; i < 30 && r == errmsg; i++) {
			// canvasにコピー
			ctx.drawImage(video, 0, 0, w, h);
			r = await decodeImageFromBase64promise(canvas.toDataURL('image/png'))
			data.p1status = r + "(" + i +"-th attempt)";
		}
		data.p1status = r == errmsg ? "読み取り不可" : "読み取りOK!";
		// for debug
		// data.p1status = r + "(" + i +"-th attempt)";
		data.p1char = r;
	}
}, false); 

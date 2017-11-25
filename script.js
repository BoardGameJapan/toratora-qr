var data = {
	players: [
	{
		title: 'Status',
		status: '初期状態',
		char: 1,
	},
	{
		title: 'Player1',
		status: '未読み取り',
		char: 0,
	},
	{
		title: 'Player2',
		status: '未読み取り',
		char: 0,
	}
	],
};
const s = data.players[0];
var app = new Vue({
	el: '#app',
	data: data,
});

var video = document.getElementById('video');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var localStream = null;
var w, h;

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

if (navigator.mediaDevices) {
//	var constraints = { audio: false, video: { facingMode: "environment", width: 1280, height: 720 } };
	var constraints = { audio: false, video: { facingMode: "environment" } };
	navigator.mediaDevices.getUserMedia(constraints)
		.then(function(stream) {
			// video.src = window.URL.createObjectURL(stream);
			video.srcObject = stream;
			localStream = stream;

			// videoの縦幅横幅を取得
			w = video.offsetWidth;
			h = video.offsetHeight;
			s.status += "(width: " + w + ", height: " + h + ")";

			// 同じサイズをcanvasに指定
			canvas.setAttribute("width", w);
			canvas.setAttribute("height", h);
		})
		.catch(function(err) {
			s.status = err.name + ": " + err.message;
		});
} else {
	s.status = "getUserMedia() is not supported in your browser.";
}

const errmsg = "error decoding QR Code";

function decodeImageFromBase64(data)
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

async function detectNumOfQRcode()
{
	var r = errmsg;
	for (i = 0; i < 30 && r == errmsg; i++) {
		// canvasにコピー
		ctx.drawImage(video, 0, 0, w, h);
		r = await decodeImageFromBase64(canvas.toDataURL('image/png'))
		p.status = r + "(" + i +"-th attempt)";
	}
	p.char = r;
	console.log("Player: " + s.char + ", num: " + p.char);
	return r != errmsg;
}

function judgeWinPlayer(p1, p2)
{
	var mod = p2 - p1 % 4;
	// 0ならあいこ、1or2ならPlayer1(2)が勝利
	return (mod == 1) ? 2 : (mod == -1) ? 1 : 0;
}

document.getElementById("action").addEventListener('click', async function() {
	if (localStream) {
		// 状況によりpを切り替え
		p = data.players[s.char];
		s.status = "Player" + s.char + "読み取り中";

		// QRコードから数値を取得
		var result = await detectNumOfQRcode();
		if (! result) {
			p.status = "読み取り不可";
		} else {
			p.status = "読み取りOK!";

			console.log("Finished reading player" + s.char + "!");
			if (s.char == 1) {
				s.char = 2;
				s.status = "Player" + s.char + "読み取り待ち";
			} else {
				// 勝敗判定
				var judge = jugdeWinPlayer(data.players[1].char, data.players[2].char);
				s.status = judge == 0 ? "あいこ" : ("Player" + judge + "の勝利!");

				// reset
				s.char = 1;
				data.players[1].char = 0;
				data.players[2].char = 0;
			}
		}
	}
}, false); 

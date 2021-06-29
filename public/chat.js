let socket = io();
let divVideoChatLobby = document.getElementById("video-chat-lobby");
let divVideoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("roomName");
let endcall = document.getElementById("end-call");
let mute=document.getElementById("mute");
let hide=document.getElementById("hide");
let endcall1 = document.getElementById("end-call1");
let mute1=document.getElementById("mute1");
let hide1=document.getElementById("hide1");
let s=document.getElementById("localScreenshot");
let c=document.getElementById("localCanvas");
let screenshot=document.getElementById("btn_screenshot");

let roomName; 
let creator = false;
let rtcPeerConnection;
let userStream;



// Contains the stun server URL we will be using.
let iceServers = {
    iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" },
    ],
};

joinButton.addEventListener("click", function () {
    if (roomInput.value == "") {
        alert("Please enter a room name");
    } else {
        roomName = roomInput.value;
        socket.emit("join", roomName);
    }
});

// Triggered when a room is succesfully created.

socket.on("created", function () {
    creator = true;
    navigator.mediaDevices
        .getUserMedia({
            audio: true,
            video:  {width:640, height:480},
        })
        .then(function (stream) {
            /* use the stream */
            userStream = stream;
            divVideoChatLobby.style = "display:none";
            endcall.style="display:inline";
            mute.style="display:inline";
            hide.style="display:inline";
            screenshot.style="display:inline";
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function (e) {
                userVideo.play();
            };
        })
        .catch(function (err) {
            /* handle the error */
            alert("Couldn't Access User Media");
        });

      
});

// Triggered when a room is succesfully joined.

socket.on("joined", function () {
    creator = false;
    navigator.mediaDevices
        .getUserMedia({
            audio: true,
            video: {width:640, height:480},
        })
        .then(function (stream) {
            /* use the stream */
            userStream = stream;
            divVideoChatLobby.style = "display:none";
            endcall1.style="display:inline";
            mute1.style="display:inline";
            hide1.style="display:inline";
            screenshot.style="display:inline"
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function (e) {
                userVideo.play();
            };
            socket.emit("ready", roomName);
        })
        .catch(function (err) {
            /* handle the error */
            alert("Couldn't Access User Media");
        });
      
});

// Triggered when a room is full (meaning has 2 people).

socket.on("full", function () {
    alert("Room is Full, Can't Join");
});

// Triggered when a peer has joined the room and ready to communicate.

socket.on("ready", function () {
    if (creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection
            .createOffer()
            .then((offer) => {
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit("offer", offer, roomName);
            })

            .catch((error) => {
                console.log(error);
            });
    }
});

// Triggered on receiving an ice candidate from the peer.

socket.on("candidate", function (candidate) {
    let icecandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(icecandidate);
});

// Triggered on receiving an offer from the person who created the room.

socket.on("offer", function (offer) {
    if (!creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection
            .createAnswer()
            .then((answer) => {
                rtcPeerConnection.setLocalDescription(answer);
                socket.emit("answer", answer, roomName);
            })
            .catch((error) => {
                console.log(error);
            });
    }
});

// Triggered on receiving an answer from the person who joined the room.

socket.on("answer", function (answer) {
    rtcPeerConnection.setRemoteDescription(answer);
});

// Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.

function OnIceCandidateFunction(event) {
    console.log("Candidate");
    if (event.candidate) {
        socket.emit("candidate", event.candidate, roomName);
    }
}

// Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.

function OnTrackFunction(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function (e) {
        peerVideo.play();
    };
}

mute.addEventListener("click",function muteMic() {
    userStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
  })

  hide.addEventListener("click",function hideVideo() {
     userStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
   // userVideo.style="display:none";
  })

  mute1.addEventListener("click",function muteMic() {
    userStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
  })
  
  hide1.addEventListener("click",function hideVideo() {
    userStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
  })

  function btn_screenshot(){
     var ctx=c.getContext("2d");
     ctx.drawImage(userVideo,0,0,c.width,c.height);
     s.src=c.toDataURL('image/png');
  }
  
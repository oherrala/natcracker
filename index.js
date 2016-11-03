natCracker = function(callback) {
    unique_ips = new Set();
    iceServers = { "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" },
        { "urls": "stun:stun.services.mozilla.com" }
    ]};

    peerConnection = new RTCPeerConnection(iceServers);

    peerConnection.onicecandidate = function (event) {
        if (event.candidate) {
            /* FIXME: Cutting corners here */
            parts = event.candidate.candidate.split(" ");
            ip = parts[4];

            if(!unique_ips.has(ip)) {
                unique_ips.add(ip);
                callback(parts[4]);
            }
        }
    };

    var options = { offerToReceiveVideo: true, offerToReceiveAudio: true };
    peerConnection.createOffer(options).then(
        function (localSessionDescription) {
            peerConnection.setLocalDescription(localSessionDescription);
        }
    );
}

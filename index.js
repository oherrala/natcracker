nat_cracker = function(timeout) {
    if(!timeout) {
        timeout = 1000;
    }

    tear_down = function(pc, resolve) {
        pc.close();
        resolve(results);
    }

    nat_cracker_promise = function(resolve, reject) {
        // Set of unique IPs found
        unique_ips = new Set();

        // Array of results
        results = new Array();

        // Count onicecandidate callbacks
        callbacks_done = 0;

        iceServers = {
            "iceCandidatePoolSize": 64,
            "iceServers": [
                { "urls": "stun:stun.l.google.com:19302" },
                { "urls": "stun:stun.services.mozilla.com" }
            ]
        };

        peerConnection = new RTCPeerConnection(iceServers);

        close_timer_id = window.setTimeout(
            tear_down,
            timeout,
            peerConnection,
            resolve
        );

        peerConnection.onicecandidate = function (event) {
            callbacks_done++;

            // https://tools.ietf.org/html/rfc5245#section-15.1
            parts = event.candidate.candidate.split(" ");

            // We don't know yet what kind of IP this is. Maybe it's browser's
            // IP or public IP of NAT gw
            ip = parts[4];

            type = null;
            if (parts.indexOf("typ")) {
                type = parts[parts.indexOf("typ")+1];
            }

            raddr = null;
            if(type && type.startsWith("srflx")) {
                // Server reflexive address
                raddr = parts[parts.indexOf("raddr")+1];
                type = "nat";
            }

            if(ip && !unique_ips.has(ip)) {
                unique_ips.add(ip);
                results.push({ "ip": ip, "type": type });
            }

            if(raddr && !unique_ips.has(raddr)) {
                unique_ips.add(ip);
                results.push({ "ip": raddr, "type": "host" });
            }

            if(callbacks_done / unique_ips.size > 4) {
                window.clearTimeout(close_timer_id);
                tear_down(peerConnection, resolve);
            }

        };

        var options = { offerToReceiveVideo: true, offerToReceiveAudio: true };
        peerConnection.createOffer(options).then(
            function (localSessionDescription) {
                peerConnection.setLocalDescription(localSessionDescription);
            }
        );
    }

    return new Promise(nat_cracker_promise);
}

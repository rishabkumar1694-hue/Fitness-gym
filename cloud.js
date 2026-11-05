/* FitZone cloud.js — Firebase cloud sync (optional layer)
   Is file me neeche firebaseConfig me Firebase console se values daalo.
   Jab tak __ wale placeholder hain, ye file kuch nahi karti (Local Mode).
   Config daalne par app Cloud Mode me chalega — sab devices ka data sync hoga. */
(function(){
  var firebaseConfig = {
    apiKey:            "__API_KEY__",
    authDomain:        "__AUTH_DOMAIN__",
    projectId:         "__PROJECT_ID__",
    storageBucket:     "__STORAGE_BUCKET__",
    messagingSenderId: "__SENDER_ID__",
    appId:             "__APP_ID__"
  };
  if (String(firebaseConfig.apiKey).indexOf("__") === 0) return; // Local Mode — cloud off

  function loadScript(src, cb){
    var s = document.createElement("script");
    s.src = src; s.onload = cb;
    document.head.appendChild(s);
  }

  loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js", function(){
    loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js", function(){
      try {
        firebase.initializeApp(firebaseConfig);
        var db = firebase.firestore();
        var stateRef = db.collection("fitzone").doc("state");
        var busy = false;

        // badge
        var badge = document.createElement("div");
        badge.textContent = "☁️ Cloud sync ON";
        badge.style.cssText = "position:fixed;top:8px;right:10px;font-size:11px;padding:4px 10px;border-radius:999px;background:#1B2430;border:1px solid #263243;color:#9FB0C3;z-index:9";
        document.body.appendChild(badge);

        // save() ko wrap karo — har save cloud me bhi jayega
        var origSave = window.save;
        window.save = function(d){
          if (origSave) origSave(d);
          if (!busy) {
            try { stateRef.set(JSON.parse(JSON.stringify(d))).catch(function(e){ console.warn("Cloud sync fail:", e); }); }
            catch(e){ console.warn(e); }
          }
        };

        function refreshUI(){
          var sp = document.getElementById("ownerSetPin"), ep = document.getElementById("ownerEnterPin");
          if (sp) sp.style.display = D.pin ? "none" : "block";
          if (ep) ep.style.display = D.pin ? "block" : "none";
          var ov = document.getElementById("ownerView");
          if (ov && ov.style.display !== "none") { try { renderOwner(); } catch(e){} }
          var mv = document.getElementById("memberView");
          if (mv && mv.style.display !== "none" && curMember) { try { renderMember(); } catch(e){} }
        }

        // live sync — kisi bhi device pe change hua to sab update
        stateRef.onSnapshot(function(snap){
          busy = true;
          if (snap.exists) {
            var d = snap.data();
            D.pin = (typeof d.pin === "string") ? d.pin : null;
            D.members = Array.isArray(d.members) ? d.members : [];
            D.checkins = (d.checkins && typeof d.checkins === "object") ? d.checkins : {};
            D.requests = Array.isArray(d.requests) ? d.requests : [];
            try { localStorage.setItem("fitzoneData", JSON.stringify(D)); } catch(e){}
          } else {
            // pehli baar: local data cloud me seed karo
            try { stateRef.set(JSON.parse(JSON.stringify(D))); } catch(e){}
          }
          busy = false;
          refreshUI();
        }, function(e){
          console.warn("Cloud error:", e);
          badge.textContent = "⚠️ Cloud offline";
        });
      } catch(e){ console.warn("Firebase init failed:", e); }
    });
  });
})();

    const allChk = document.getElementById("allChk");
    const resChks = document.querySelectorAll(".resChk");

    allChk.addEventListener("change", () => {
      resChks.forEach(cb => cb.checked = allChk.checked);
    });

    resChks.forEach(cb => {
      cb.addEventListener("change", () => {
        if ([...resChks].every(c => c.checked)) {
          allChk.checked = true;
        } else if ([...resChks].every(c => !c.checked)) {
          allChk.checked = false;
        }
      });
    });

    // Logs
    async function logMessage(text, delay=30){
      const log = document.getElementById("log");
      for(let i=0;i<text.length;i++){
        log.value += text[i];
        log.scrollTop = log.scrollHeight;
        await new Promise(res=>setTimeout(res,delay));
      }
      log.value += "\n";
    }

    async function downloadSite(){
      const url = document.getElementById("url").value.trim();
      const preview = document.getElementById("preview");
      const zipCustom = document.getElementById("zipName").value.trim();
      const progressBar = document.getElementById("progress");
      const log = document.getElementById("log");

      log.value=""; progressBar.value=0;
      if(!url){ logMessage("⚠️ Enter a valid URL!"); return; }

      document.querySelectorAll("input[type='checkbox']").forEach(cb=>cb.disabled=true);

      const htmlChk = document.getElementById("htmlChk").checked;
      const cssChk = document.getElementById("cssChk").checked;
      const jsChk = document.getElementById("jsChk").checked;
      const imgChk = document.getElementById("imgChk").checked;
      const fontChk = document.getElementById("fontChk").checked;

      let domain = url.replace(/https?:\/\//,'').split('/')[0];
      let zipName = zipCustom?`getSource-${zipCustom}.zip`:`getSource-${domain}.zip`;

      try{
        await logMessage("📡 Fetching HTML...");
        const res = await fetch(url);
        const htmlText = await res.text();
        preview.srcdoc = htmlText;

        const zip = new JSZip();
        if(htmlChk) zip.file("index.html", htmlText);

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText,"text/html");

        let resources=[];
        if(cssChk) resources.push(...[...doc.querySelectorAll("link[rel='stylesheet']")].map(l=>l.href));
        if(jsChk) resources.push(...[...doc.querySelectorAll("script[src]")].map(s=>s.src));
        if(imgChk) resources.push(...[...doc.querySelectorAll("img")].map(i=>i.src));
        if(fontChk) resources.push(...[...doc.querySelectorAll("link[rel='stylesheet']")].map(l=>l.href).filter(h=>h.match(/\.(woff2?|ttf|otf)$/)));

        await logMessage(`🔍 Found ${resources.length} resources`);

        for(let i=0;i<resources.length;i++){
          const r=resources[i];
          try{
            if(!r.startsWith("http")) continue;
            await logMessage(`⬇️ Fetching ${r}...`);
            const rRes=await fetch(r);
            const blob=await rRes.blob();
            const filename=r.split("/").pop()||"file";
            zip.file(filename,blob);
          }catch(e){
            await logMessage(`❌ Failed: ${r}`);
          }
          progressBar.value=((i+1)/resources.length)*100;
        }

        await logMessage("⚙️ Generating ZIP...");
        const content=await zip.generateAsync({type:"blob"});
        const a=document.createElement("a");
        a.href=URL.createObjectURL(content);
        a.download=zipName;
        a.click();
        await logMessage(`✅ Saved as ${zipName} getSource folder!`);

      }catch(e){
         await logMessage("🚨 Error: "+e.message);
      } finally {
        document.querySelectorAll("input[type='checkbox']").forEach(cb=>cb.disabled=false);
      }
    }
async function findLinks() {
    hide("#qs");
    show("#searching");
    let counter = new vardom("#linksFound");
    let query = new vardom("#query");
    counter(0);
    query("");
    let questions = document.querySelector("#questions").value.replace(/\n+/g,"\n").split("\n");
    let searchRes = {};
    for (let i = 0; i < questions.length; i++) {
        query(questions[i]);
        let res = await search(questions[i]);
        let cv = counter() + res.length;
        counter(cv);
        searchRes[questions[i]] = res.slice(0,3);
    }
    getArticles(searchRes);
}

async function getArticles(searchRes) {
    hide("#searching");
    show("#fetching");
    let artName = new vardom("#articlename");
    let read = new vardom("#articlesread");
    artName("");
    read(0);
    let results = [];
    let keys = Object.keys(searchRes);
    for (let a = 0; a < keys.length; a++) {
        for (let b = 0; b < searchRes[keys[a]].length; b++) {
            const element = searchRes[keys[a]][b];
            artName(element.title);
            let report = await genReport(element.url);
            searchRes[keys[a]][b] = report;
            searchRes[keys[a]][b].citation = citation([report])[0];
            read(read()+1);
        }
    }
    console.log(searchRes);
    printArticles(searchRes);
}

function printArticles(results) {
    hide("#fetching");
    show("#summaries");
    let html = "";
    let keys = Object.keys(results);
    for (let a = 0; a < keys.length; a++) {
        html += `<h1>${keys[a]}</h1>`;
        let first = results[keys[a]][0];
        html += `<h2><a href="${first.url}" target="_blank">${first.title}</a></h2>
        <p>${first.summaries.map(e => `<span class="sent" style="background: ${randomColor({luminosity: "light"})};">${e}</span>`).join(" ")}</p>`;
        for (let b = 1; b < results[keys[a]].length; b++) {
            let el = results[keys[a]][b];
            html += `
            <details>
  <summary><a href="${el.url}" target="_blank">${el.title}</a></summary>
  <p>${el.summaries.map(e => `<span class="sent" style="background: ${randomColor({luminosity: "light"})};">${e}</span>`).join(" ")}</p>
</details>`;
            
        }
        html += "<br><br><br>";
    }
    document.querySelector("#results").innerHTML = html;
}

function vardom(e) {
    return eval(`((i) =>{
    if (typeof i != "undefined") {
      this.v = i;
      var m = document.querySelectorAll("`+ e + `");
      for (var a = 0; a < m.length; a++) {
        m[a].innerHTML = i;
      }
    } else {
      return this.v;
    }
  });`);
}

function hide(el) {
    document.querySelector(el).style.display = "none";
}

function show(el) {
    document.querySelector(el).style.display = "block";
}
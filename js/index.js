async function findLinks() {
    hide("#qs");
    show("#searching");
    let counter = new vardom("#linksFound");
    let query = new vardom("#query");
    counter(0);
    query("");
    let questions = document.querySelector("#questions").value.trim().replace(/\n+/g,"\n").split("\n");
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
    printArticles(searchRes);
}

function printArticles(results) {
    hide("#fetching");
    show("#summaries");
    let html = "";
    let keys = Object.keys(results);
    for (let a = 0; a < keys.length; a++) {
        html += `<h1>${keys[a]}</h1>`;
        results[keys[a]][0].highlights = new Array(results[keys[a]][0].summaries.length).fill(0).map(()=>{return randomColor({luminosity: "bright"})});
        let first = results[keys[a]][0];
        html += `<h2><a href="${first.url}" target="_blank">${first.title}</a></h2>
        <p>${first.summaries.map((e, index) => `<span class="sent" onclick="openArt(${a}, 0, ${index})" style="text-decoration: underline 2px ${first.highlights[index]};">${bionic(e)}</span>`).join(" ")}</p>`;
        for (let b = 1; b < results[keys[a]].length; b++) {
            results[keys[a]][b].highlights = new Array(results[keys[a]][b].summaries.length).fill(0).map(()=>{return randomColor({luminosity: "bright"})});
            let el = results[keys[a]][b];
            html += `
            <details>
  <summary><a href="${el.url}" target="_blank">${el.title}</a></summary>
  <p>${el.summaries.map((e, index) => `<span class="sent" onclick="openArt(${a}, ${b}, ${index})" style="text-decoration: underline 2px ${el.highlights[index]};">${bionic(e)}</span>`).join(" ")}</p>
</details>`;
            
        }
        html += "<br><br><br>";
    }
    window.articles = results;
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

function bionic(text) {
    return text.split(" ").map((e)=>{return `<strong>${e.slice(0, Math.round(e.length/2))}</strong>${e.slice(Math.round(e.length/2))}`}).join(" ");
}

function openArt(query, doc, index) {
    document.querySelector("#doc").innerHTML = `<div onclick="(()=>{hide('#doc');show('#summaries')})()" id="exit">X</div>`+highLightSummeries(window.articles[Object.keys(window.articles)[query]][doc].article, window.articles[Object.keys(window.articles)[query]][doc]);
    show("#doc");
    hide("#summaries")
}

function highLightSummeries(html, article) {
    let summaries = article.summaries;
    for (let a = 0; a < summaries.length; a++) {
        const sum = summaries[a];
        html = html.replace(new RegExp(sum, "g"), `<span style="text-decoration: underline 2px ${article.highlights[a]};">${sum}</span>`);
    }
    return html;
}
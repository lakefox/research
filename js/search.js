/**
 * It fetches the HTML of the DuckDuckGo search page, parses it, and returns the results
 * @param query - The query to search for
 * @returns An array of objects with the following properties:
 *     title: The title of the result
 *     description: The description of the result
 *     url: The url of the result
 */
async function search(query) {
    const html = await fetch(`https://cors.lowsh.workers.dev/?https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`);
    let text = await html.text();
    let doc = parseHTML(text);
    let sponsored = [...doc.querySelectorAll("tr[class='result-sponsored']")].pop();
    let trs = [...doc.querySelectorAll("tr")];
    let rawRes = [...chunks(trs.slice(trs.indexOf(sponsored) + 1), 4)]

    let results = [];
    for (let i = 0; i < rawRes.length; i++) {
        const group = rawRes[i];
        if (group.length == 4) {
            results.push({
                title: group[1].querySelector("a").textContent,
                description: group[2].querySelector("td[class='result-snippet']").textContent,
                url: "http://" + group[3].querySelector("span[class='link-text']").textContent
            });
        }
    }
    return results;
}

/**
 * It takes a URL, fetches the HTML, parses it, and returns a JSON object with the title, summary, and
 * text of the article
 * @param url - The URL of the article you want to summarize.
 * @returns An object with the following properties:
 */
async function genReport(url) {
    let content = [''];

    let data = {};
    let html = await fetch("https://cors.lowsh.workers.dev/?"+url).then(e => e.text());
    html = html.replace(/\</g, " <");
    let doc = new DOMParser().parseFromString(html, "text/html");
    let article = new Readability(doc).parse();
    if (article == null) {
        throw new Error("No Content");
    }
    let parsed = parseHTML(article.content);
    content = [...parsed.querySelectorAll('p')];

    let cntLn = 0;
    for (let i = 0; i < content.length; i++) {
        cntLn += content[i].textContent.length;
    }
    cntLn = cntLn / content.length;
    let massText = [];

    for (let i = 0; i < content.length; i++) {
        if (content[i].textContent.length < cntLn) {
            massText[massText.length - 1] += content[i].textContent;
        } else {
            massText.push(content[i].textContent);
        }
    }

    massText = massText.map((e) => { return e.replace(/\[[0-9]+\]/g, "").replaceAll(/\s+/g, " ").replace(/\s\./g, ".").trim() })
    let sum = keySentence(massText.join(' '));
    
    data.title = article.title;
    data.summaries = sum;
    data.text = massText;
    data.url = url;
    data.author = article.byline || "Unknown Uknown";
    data.site = article.siteName || "Unkown";
    return data;
}

function parseHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
}
/**
 * It takes an array of objects and returns an array of strings
 * @param reports - an array of objects that contain the following properties:
 * @returns A list of citations.
 */
function citation(reports) {
    let template = (aLast, aFirst, title, site, publisher, date, url) => {
        // Date: 27 Jan. 2022
        return `${aLast}, ${aFirst}. “${title}” ${site}, ${publisher}, ${date}, ${url}. `;
    }

    let citations = [];

    for (let i = 0; i < reports.length; i++) {
        let report = reports[i];
        let author = report.author.split(" ").reverse();
        citations.push(template(author[1], author[0], report.title, report.site, report.site, new Date().toShortFormat(), report.url));

    }

    return citations;
}

Date.prototype.toShortFormat = function () {

    const monthNames = ["Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec"];

    const day = this.getDate();

    const monthIndex = this.getMonth();
    const monthName = monthNames[monthIndex];

    const year = this.getFullYear();

    return `${day} ${monthName} ${year}`;
}
/**
 * It takes a text and returns a function that takes a paragraph and returns the most important
 * sentence in that paragraph.
 * @param text - The text to be analyzed
 * @returns A function that takes a paragraph and returns the most important sentence.
 */
function keySentence(text) {
    let document = [];
    let stoplist = ["", "a", "about", "above", "above", "across", "after", "afterwards", "again", "against", "all", "almost", "alone", "along", "already", "also", "although", "always", "am", "among", "amongst", "amoungst", "amount", "an", "and", "another", "any", "anyhow", "anyone", "anything", "anyway", "anywhere", "are", "around", "as", "at", "back", "be", "became", "because", "become", "becomes", "becoming", "been", "before", "beforehand", "behind", "being", "below", "beside", "besides", "between", "beyond", "bill", "both", "bottom", "but", "by", "call", "can", "cannot", "cant", "co", "con", "could", "couldnt", "cry", "de", "describe", "detail", "do", "done", "down", "due", "during", "each", "eg", "eight", "either", "eleven", "else", "elsewhere", "empty", "enough", "etc", "even", "ever", "every", "everyone", "everything", "everywhere", "except", "few", "fifteen", "fify", "fill", "find", "fire", "first", "five", "for", "former", "formerly", "forty", "found", "four", "from", "front", "full", "further", "get", "give", "go", "had", "has", "hasnt", "have", "he", "hence", "her", "here", "hereafter", "hereby", "herein", "hereupon", "hers", "herself", "him", "himself", "his", "how", "however", "hundred", "ie", "if", "in", "inc", "indeed", "interest", "into", "is", "it", "its", "itself", "keep", "last", "latter", "latterly", "least", "less", "ltd", "made", "many", "may", "me", "meanwhile", "might", "mill", "mine", "more", "moreover", "most", "mostly", "move", "much", "must", "my", "myself", "name", "namely", "neither", "never", "nevertheless", "next", "nine", "no", "nobody", "none", "noone", "nor", "not", "nothing", "now", "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto", "or", "other", "others", "otherwise", "our", "ours", "ourselves", "out", "over", "own", "part", "per", "perhaps", "please", "put", "rather", "re", "same", "see", "seem", "seemed", "seeming", "seems", "serious", "several", "she", "should", "show", "side", "since", "sincere", "six", "sixty", "so", "some", "somehow", "someone", "something", "sometime", "sometimes", "somewhere", "still", "such", "system", "take", "ten", "than", "that", "the", "their", "them", "themselves", "then", "thence", "there", "thereafter", "thereby", "therefore", "therein", "thereupon", "these", "they", "thickv", "thin", "third", "this", "those", "though", "three", "through", "throughout", "thru", "thus", "to", "together", "too", "top", "toward", "towards", "twelve", "twenty", "two", "un", "under", "until", "up", "upon", "us", "very", "via", "was", "we", "well", "were", "what", "whatever", "when", "whence", "whenever", "where", "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever", "whether", "which", "while", "whither", "who", "whoever", "whole", "whom", "whose", "why", "will", "with", "within", "without", "would", "yet", "you", "your", "yours", "yourself", "yourselves", "the"];
    let sents = breakSentace(text);
    sents.pop();
    let i = 0;

    //Index sentences in document
    sents.forEach(function (sentencz) {
        let wordz = sentencz.split(' ').filter(function (n) { return stoplist.indexOf(n) == -1 });
        document.push(
            {
                sentence: sentencz,
                words: wordz,
                score: 0
            }
        );
        i++;
    });

    //Assign word frequencies
    document.forEach(function (arrayItem) {
        let count = 0;
        arrayItem.words.forEach(function (word) {
            let match = word;
            document.forEach(function (arrayItem2) {
                arrayItem2.words.forEach(function (word2) {
                    if (word2 === match)
                        count++;
                });
            });
        });
        count = count / arrayItem.words.length;
        arrayItem.frequency = count;
    });

    document.sort(function (a, b) {
        return b.frequency - a.frequency;
    });
    let justSents = document.slice(1, 20).map(e=>e.sentence);
    return [sents[0], ...justSents];
}

function breakSentace(sentances, keep = false) {
    sentances = sentances.replaceAll(/\s+/g, " ");
    if (keep) {
        return sentances.replace(/\[[0-9]+\]/g, "").replace(/(?<!Mr|Mrs|Ms|Dr|Sr)([\.?\??\!?]) ([A-Z])/gi, "$1{break}$2").split("{break}");
    } else {
        return sentances.replace(/\[[0-9]+\]/g, "").replace(/(?<!Mr|Mrs|Ms|Dr|Sr)([\.?\??\!?]) ([A-Z])/gi, "$1{break}$2").toLowerCase().split("{break}");
    }
}
function tag(text, count = 10) {
    /*
 @param String html    The string with HTML which has be converted to a DOM object
 @param func callback  (optional) Callback(HTMLDocument doc, function destroy)
 @returns              undefined if callback exists, else: Object
                        HTMLDocument doc  DOM fetched from Parameter:html
                        function destroy  Removes HTMLDocument doc.         */
    function string2dom(html, callback) {
        /* Sanitise the string */
        html = sanitiseHTML(html); /*Defined at the bottom of the answer*/

        /* Create an IFrame */
        var iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        var doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();

        function destroy() {
            iframe.parentNode.removeChild(iframe);
        }
        if (callback) callback(doc, destroy);
        else return { "doc": doc, "destroy": destroy };
    }

    /* @name sanitiseHTML
       @param String html  A string representing HTML code
       @return String      A new string, fully stripped of external resources.
                           All "external" attributes (href, src) are prefixed by data- */

    function sanitiseHTML(html) {
        /* Adds a <!-\"'--> before every matched tag, so that unterminated quotes
            aren't preventing the browser from splitting a tag. Test case:
           '<input style="foo;b:url(0);><input onclick="<input type=button onclick="too() href=;>">' */
        var prefix = "<!--\"'-->";
        /*Attributes should not be prefixed by these characters. This list is not
         complete, but will be sufficient for this function.
          (see http://www.w3.org/TR/REC-xml/#NT-NameChar) */
        var att = "[^-a-z0-9:._]";
        var tag = "<[a-z]";
        var any = "(?:[^<>\"']*(?:\"[^\"]*\"|'[^']*'))*?[^<>]*";
        var etag = "(?:>|(?=<))";

        /*
          @name ae
          @description          Converts a given string in a sequence of the
                                 original input and the HTML entity
          @param String string  String to convert
          */
        var entityEnd = "(?:;|(?!\\d))";
        var ents = {
            " ": "(?:\\s|&nbsp;?|&#0*32" + entityEnd + "|&#x0*20" + entityEnd + ")",
            "(": "(?:\\(|&#0*40" + entityEnd + "|&#x0*28" + entityEnd + ")",
            ")": "(?:\\)|&#0*41" + entityEnd + "|&#x0*29" + entityEnd + ")",
            ".": "(?:\\.|&#0*46" + entityEnd + "|&#x0*2e" + entityEnd + ")"
        };
        /*Placeholder to avoid tricky filter-circumventing methods*/
        var charMap = {};
        var s = ents[" "] + "*"; /* Short-hand space */
        /* Important: Must be pre- and postfixed by < and >. RE matches a whole tag! */
        function ae(string) {
            var all_chars_lowercase = string.toLowerCase();
            if (ents[string]) return ents[string];
            var all_chars_uppercase = string.toUpperCase();
            var RE_res = "";
            for (var i = 0; i < string.length; i++) {
                var char_lowercase = all_chars_lowercase.charAt(i);
                if (charMap[char_lowercase]) {
                    RE_res += charMap[char_lowercase];
                    continue;
                }
                var char_uppercase = all_chars_uppercase.charAt(i);
                var RE_sub = [char_lowercase];
                RE_sub.push("&#0*" + char_lowercase.charCodeAt(0) + entityEnd);
                RE_sub.push("&#x0*" + char_lowercase.charCodeAt(0).toString(16) + entityEnd);
                if (char_lowercase != char_uppercase) {
                    RE_sub.push("&#0*" + char_uppercase.charCodeAt(0) + entityEnd);
                    RE_sub.push("&#x0*" + char_uppercase.charCodeAt(0).toString(16) + entityEnd);
                }
                RE_sub = "(?:" + RE_sub.join("|") + ")";
                RE_res += (charMap[char_lowercase] = RE_sub);
            }
            return (ents[string] = RE_res);
        }
        /*
          @name by
          @description  second argument for the replace function.
          */
        function by(match, group1, group2) {
            /* Adds a data-prefix before every external pointer */
            return group1 + "data-" + group2
        }
        /*
          @name cr
          @description            Selects a HTML element and performs a
                                      search-and-replace on attributes
          @param String selector  HTML substring to match
          @param String attribute RegExp-escaped; HTML element attribute to match
          @param String marker    Optional RegExp-escaped; marks the prefix
          @param String delimiter Optional RegExp escaped; non-quote delimiters
          @param String end       Optional RegExp-escaped; forces the match to
                                      end before an occurence of <end> when 
                                      quotes are missing
         */
        function cr(selector, attribute, marker, delimiter, end) {
            if (typeof selector == "string") selector = new RegExp(selector, "gi");
            marker = typeof marker == "string" ? marker : "\\s*=";
            delimiter = typeof delimiter == "string" ? delimiter : "";
            end = typeof end == "string" ? end : "";
            var is_end = end && "?";
            var re1 = new RegExp("(" + att + ")(" + attribute + marker + "(?:\\s*\"[^\"" + delimiter + "]*\"|\\s*'[^'" + delimiter + "]*'|[^\\s" + delimiter + "]+" + is_end + ")" + end + ")", "gi");
            html = html.replace(selector, function (match) {
                return prefix + match.replace(re1, by);
            });
        }
        /* 
          @name cri
          @description            Selects an attribute of a HTML element, and
                                   performs a search-and-replace on certain values
          @param String selector  HTML element to match
          @param String attribute RegExp-escaped; HTML element attribute to match
          @param String front     RegExp-escaped; attribute value, prefix to match
          @param String flags     Optional RegExp flags, default "gi"
          @param String delimiter Optional RegExp-escaped; non-quote delimiters
          @param String end       Optional RegExp-escaped; forces the match to
                                      end before an occurence of <end> when 
                                      quotes are missing
         */
        function cri(selector, attribute, front, flags, delimiter, end) {
            if (typeof selector == "string") selector = new RegExp(selector, "gi");
            flags = typeof flags == "string" ? flags : "gi";
            var re1 = new RegExp("(" + att + attribute + "\\s*=)((?:\\s*\"[^\"]*\"|\\s*'[^']*'|[^\\s>]+))", "gi");

            end = typeof end == "string" ? end + ")" : ")";
            var at1 = new RegExp('(")(' + front + '[^"]+")', flags);
            var at2 = new RegExp("(')(" + front + "[^']+')", flags);
            var at3 = new RegExp("()(" + front + '(?:"[^"]+"|\'[^\']+\'|(?:(?!' + delimiter + ').)+)' + end, flags);

            var handleAttr = function (match, g1, g2) {
                if (g2.charAt(0) == '"') return g1 + g2.replace(at1, by);
                if (g2.charAt(0) == "'") return g1 + g2.replace(at2, by);
                return g1 + g2.replace(at3, by);
            };
            html = html.replace(selector, function (match) {
                return prefix + match.replace(re1, handleAttr);
            });
        }

        /* <meta http-equiv=refresh content="  ; url= " > */
        html = html.replace(new RegExp("<meta" + any + att + "http-equiv\\s*=\\s*(?:\"" + ae("refresh") + "\"" + any + etag + "|'" + ae("refresh") + "'" + any + etag + "|" + ae("refresh") + "(?:" + ae(" ") + any + etag + "|" + etag + "))", "gi"), "<!-- meta http-equiv=refresh stripped-->");

        /* Stripping all scripts */
        html = html.replace(new RegExp("<script" + any + ">\\s*//\\s*<\\[CDATA\\[[\\S\\s]*?]]>\\s*</script[^>]*>", "gi"), "<!--CDATA script-->");
        html = html.replace(/<script[\S\s]+?<\/script\s*>/gi, "<!--Non-CDATA script-->");
        cr(tag + any + att + "on[-a-z0-9:_.]+=" + any + etag, "on[-a-z0-9:_.]+"); /* Event listeners */

        cr(tag + any + att + "href\\s*=" + any + etag, "href"); /* Linked elements */
        cr(tag + any + att + "src\\s*=" + any + etag, "src"); /* Embedded elements */

        cr("<object" + any + att + "data\\s*=" + any + etag, "data"); /* <object data= > */
        cr("<applet" + any + att + "codebase\\s*=" + any + etag, "codebase"); /* <applet codebase= > */

        /* <param name=movie value= >*/
        cr("<param" + any + att + "name\\s*=\\s*(?:\"" + ae("movie") + "\"" + any + etag + "|'" + ae("movie") + "'" + any + etag + "|" + ae("movie") + "(?:" + ae(" ") + any + etag + "|" + etag + "))", "value");

        /* <style> and < style=  > url()*/
        cr(/<style[^>]*>(?:[^"']*(?:"[^"]*"|'[^']*'))*?[^'"]*(?:<\/style|$)/gi, "url", "\\s*\\(\\s*", "", "\\s*\\)");
        cri(tag + any + att + "style\\s*=" + any + etag, "style", ae("url") + s + ae("(") + s, 0, s + ae(")"), ae(")"));

        /* IE7- CSS expression() */
        cr(/<style[^>]*>(?:[^"']*(?:"[^"]*"|'[^']*'))*?[^'"]*(?:<\/style|$)/gi, "expression", "\\s*\\(\\s*", "", "\\s*\\)");
        cri(tag + any + att + "style\\s*=" + any + etag, "style", ae("expression") + s + ae("(") + s, 0, s + ae(")"), ae(")"));
        return html.replace(new RegExp("(?:" + prefix + ")+", "g"), prefix);
    }

    let stopwords = [
        "a",
        "a's",
        "able",
        "about",
        "above",
        "according",
        "accordingly",
        "across",
        "actually",
        "after",
        "afterwards",
        "again",
        "against",
        "ain't",
        "all",
        "allow",
        "allows",
        "almost",
        "alone",
        "along",
        "already",
        "also",
        "although",
        "always",
        "am",
        "among",
        "amongst",
        "an",
        "and",
        "another",
        "any",
        "anybody",
        "anyhow",
        "anyone",
        "anything",
        "anyway",
        "anyways",
        "anywhere",
        "apart",
        "appear",
        "appreciate",
        "appropriate",
        "are",
        "aren't",
        "around",
        "as",
        "aside",
        "ask",
        "asking",
        "associated",
        "at",
        "available",
        "away",
        "awfully",
        "b",
        "be",
        "became",
        "because",
        "become",
        "becomes",
        "becoming",
        "been",
        "before",
        "beforehand",
        "behind",
        "being",
        "believe",
        "below",
        "beside",
        "besides",
        "best",
        "better",
        "between",
        "beyond",
        "both",
        "brief",
        "but",
        "by",
        "c",
        "c'mon",
        "c's",
        "came",
        "can",
        "can't",
        "cannot",
        "cant",
        "cause",
        "causes",
        "certain",
        "certainly",
        "changes",
        "clearly",
        "co",
        "com",
        "come",
        "comes",
        "concerning",
        "consequently",
        "consider",
        "considering",
        "contain",
        "containing",
        "contains",
        "corresponding",
        "could",
        "couldn't",
        "course",
        "currently",
        "d",
        "definitely",
        "described",
        "despite",
        "did",
        "didn't",
        "different",
        "do",
        "does",
        "doesn't",
        "doing",
        "don't",
        "done",
        "down",
        "downwards",
        "during",
        "e",
        "each",
        "edu",
        "eg",
        "eight",
        "either",
        "else",
        "elsewhere",
        "enough",
        "entirely",
        "especially",
        "et",
        "etc",
        "even",
        "ever",
        "every",
        "everybody",
        "everyone",
        "everything",
        "everywhere",
        "ex",
        "exactly",
        "example",
        "except",
        "f",
        "far",
        "few",
        "fifth",
        "first",
        "five",
        "followed",
        "following",
        "follows",
        "for",
        "former",
        "formerly",
        "forth",
        "four",
        "from",
        "further",
        "furthermore",
        "g",
        "get",
        "gets",
        "getting",
        "given",
        "gives",
        "go",
        "goes",
        "going",
        "gone",
        "got",
        "gotten",
        "greetings",
        "h",
        "had",
        "hadn't",
        "happens",
        "hardly",
        "has",
        "hasn't",
        "have",
        "haven't",
        "having",
        "he",
        "he's",
        "hello",
        "help",
        "hence",
        "her",
        "here",
        "here's",
        "hereafter",
        "hereby",
        "herein",
        "hereupon",
        "hers",
        "herself",
        "hi",
        "him",
        "himself",
        "his",
        "hither",
        "hopefully",
        "how",
        "howbeit",
        "however",
        "i",
        "i'd",
        "i'll",
        "i'm",
        "i've",
        "ie",
        "if",
        "ignored",
        "immediate",
        "in",
        "inasmuch",
        "inc",
        "indeed",
        "indicate",
        "indicated",
        "indicates",
        "inner",
        "insofar",
        "instead",
        "into",
        "inward",
        "is",
        "isn't",
        "it",
        "it'd",
        "it'll",
        "it's",
        "its",
        "itself",
        "j",
        "just",
        "k",
        "keep",
        "keeps",
        "kept",
        "know",
        "knows",
        "known",
        "l",
        "last",
        "lately",
        "later",
        "latter",
        "latterly",
        "least",
        "less",
        "lest",
        "let",
        "let's",
        "like",
        "liked",
        "likely",
        "little",
        "look",
        "looking",
        "looks",
        "ltd",
        "m",
        "mainly",
        "many",
        "may",
        "maybe",
        "me",
        "mean",
        "meanwhile",
        "merely",
        "might",
        "more",
        "moreover",
        "most",
        "mostly",
        "much",
        "must",
        "my",
        "myself",
        "n",
        "name",
        "namely",
        "nd",
        "near",
        "nearly",
        "necessary",
        "need",
        "needs",
        "neither",
        "never",
        "nevertheless",
        "new",
        "next",
        "nine",
        "no",
        "nobody",
        "non",
        "none",
        "noone",
        "nor",
        "normally",
        "not",
        "nothing",
        "novel",
        "now",
        "nowhere",
        "o",
        "obviously",
        "of",
        "off",
        "often",
        "oh",
        "ok",
        "okay",
        "old",
        "on",
        "once",
        "one",
        "ones",
        "only",
        "onto",
        "or",
        "other",
        "others",
        "otherwise",
        "ought",
        "our",
        "ours",
        "ourselves",
        "out",
        "outside",
        "over",
        "overall",
        "own",
        "p",
        "particular",
        "particularly",
        "per",
        "perhaps",
        "placed",
        "please",
        "plus",
        "possible",
        "presumably",
        "probably",
        "provides",
        "q",
        "que",
        "quite",
        "qv",
        "r",
        "rather",
        "rd",
        "re",
        "really",
        "reasonably",
        "regarding",
        "regardless",
        "regards",
        "relatively",
        "respectively",
        "right",
        "s",
        "said",
        "same",
        "saw",
        "say",
        "saying",
        "says",
        "second",
        "secondly",
        "see",
        "seeing",
        "seem",
        "seemed",
        "seeming",
        "seems",
        "seen",
        "self",
        "selves",
        "sensible",
        "sent",
        "serious",
        "seriously",
        "seven",
        "several",
        "shall",
        "she",
        "should",
        "shouldn't",
        "since",
        "six",
        "so",
        "some",
        "somebody",
        "somehow",
        "someone",
        "something",
        "sometime",
        "sometimes",
        "somewhat",
        "somewhere",
        "soon",
        "sorry",
        "specified",
        "specify",
        "specifying",
        "still",
        "sub",
        "such",
        "sup",
        "sure",
        "t",
        "t's",
        "take",
        "taken",
        "tell",
        "tends",
        "th",
        "than",
        "thank",
        "thanks",
        "thanx",
        "that",
        "that's",
        "thats",
        "the",
        "their",
        "theirs",
        "them",
        "themselves",
        "then",
        "thence",
        "there",
        "there's",
        "thereafter",
        "thereby",
        "therefore",
        "therein",
        "theres",
        "thereupon",
        "these",
        "they",
        "they'd",
        "they'll",
        "they're",
        "they've",
        "think",
        "third",
        "this",
        "thorough",
        "thoroughly",
        "those",
        "though",
        "three",
        "through",
        "throughout",
        "thru",
        "thus",
        "to",
        "together",
        "too",
        "took",
        "toward",
        "towards",
        "tried",
        "tries",
        "truly",
        "try",
        "trying",
        "twice",
        "two",
        "u",
        "un",
        "under",
        "unfortunately",
        "unless",
        "unlikely",
        "until",
        "unto",
        "up",
        "upon",
        "us",
        "use",
        "used",
        "useful",
        "uses",
        "using",
        "usually",
        "uucp",
        "v",
        "value",
        "various",
        "very",
        "via",
        "viz",
        "vs",
        "w",
        "want",
        "wants",
        "was",
        "wasn't",
        "way",
        "we",
        "we'd",
        "we'll",
        "we're",
        "we've",
        "welcome",
        "well",
        "went",
        "were",
        "weren't",
        "what",
        "what's",
        "whatever",
        "when",
        "whence",
        "whenever",
        "where",
        "where's",
        "whereafter",
        "whereas",
        "whereby",
        "wherein",
        "whereupon",
        "wherever",
        "whether",
        "which",
        "while",
        "whither",
        "who",
        "who's",
        "whoever",
        "whole",
        "whom",
        "whose",
        "why",
        "will",
        "willing",
        "wish",
        "with",
        "within",
        "without",
        "won't",
        "wonder",
        "would",
        "would",
        "wouldn't",
        "x",
        "y",
        "yes",
        "yet",
        "you",
        "you'd",
        "you'll",
        "you're",
        "you've",
        "your",
        "yours",
        "yourself",
        "yourselves",
        "z",
        "zero"
    ];

    function cleanText(word) {
        let validChars =
            "abcdefghijklmnopqrstuvwxyz1234567890_-$'ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
        return word
            .split("")
            .filter((c) => validChars.includes(c))
            .join("")
            .toLowerCase().trim();
    }

    let wordList = [];
    let words = cleanText(text).split(" ");

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (stopwords.indexOf(word) == -1) {
            wordList.push(word);
        }
    }

    let uniqueWords = [...new Set(wordList)];


    let wordInstances = {}

    for (let i = 0; i < words.length; i++) {
        if (uniqueWords.indexOf(words[i]) != -1) {
            if (!wordInstances[words[i]]) {
                wordInstances[words[i]] = 0;
            }
            wordInstances[words[i]] += 1;
        }
    }

    let instSort = [];
    for (const key in wordInstances) {
        instSort.push([key, wordInstances[key]]);
    }

    instSort.sort(function (a, b) {
        return b[1] - a[1];
    });

    let cutWords = instSort.slice(0, Math.max(parseInt(count / 10), 1));

    return new Promise(async (resolve, reject) => {
        let tags = {};
        for (let a = 0; a < cutWords.length; a++) {
            const word = cutWords[a];
            let res = await fetch(`https://cors.lowsh.workers.dev/?https://tiktokhashtags.com/hashtag/${word[0]}/`);
            let data = await res.text();

            let dom = string2dom(data);
            let table = dom.doc.querySelector("tbody");
            if (table != null) {
                let rows = table.querySelectorAll("tr");
                for (let b = 0; b < rows.length; b++) {
                    const row = rows[b];
                    tags[row.querySelector("a").innerText] = parseInt(row.querySelector("span").innerText.replace(",", ""));
                }
            }
            dom.destroy();
        }

        let tagSort = [];
        for (const key in tags) {
            tagSort.push([key, tags[key]]);
        }

        tagSort.sort(function (a, b) {
            return b[1] - a[1];
        });

        let tagSlice = tagSort.slice(0, count);
        let tagString = "";
        for (let i = 0; i < tagSlice.length; i++) {
            const tag = tagSlice[i];
            tagString += ` ${tag[0]}`;
        }
        resolve(tagString.trim());
    })
}


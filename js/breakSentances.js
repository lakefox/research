function breakSentace(sentances, keep = false) {
    sentances = sentances.replaceAll(/\s+/g, " ");
    if (keep) {
        return sentances.replace(/\[[0-9]+\]/g, "").replace(/(?<!Mr|Mrs|Ms|Dr|Sr)([\.?\??\!?]) ([A-Z])/gi, "$1{break}$2").split("{break}");
    } else {
        return sentances.replace(/\[[0-9]+\]/g, "").replace(/(?<!Mr|Mrs|Ms|Dr|Sr)([\.?\??\!?]) ([A-Z])/gi, "$1{break}$2").toLowerCase().split("{break}");
    }
}
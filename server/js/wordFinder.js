const _ = require("lodash");
const trie = require("trie-prefix-tree");

const { letters: oneBlank, result: twoBlanks } = require("./alphabetPairs");
const wordList = require("./wordList");
const reverseWordList = require("./reverseWordList");

const myTrie = trie(wordList); // currently 173,141 words

function wordFinder(str, numBlanks = "") {
  let result = [];
  // prettier-ignore
  numBlanks == 2 ?
  twoBlanks.forEach(blanks =>  result.push(...myTrie.getSubAnagrams(`${str}${blanks}`)) ) :
  numBlanks == 1 ?
  [...oneBlank].forEach(blank =>  result.push(...myTrie.getSubAnagrams(`${str}${blank}`)) ) :
  result.push(...myTrie.getSubAnagrams(`${str}`));

  return _.uniq(result);
}

module.exports = {
  wordFinder,
  wordTrieStr: myTrie.dump(), // currently 173,141 words
  reverseWordTrieStr: trie(reverseWordList).dump(),
};

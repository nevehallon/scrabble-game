import Trie from "../src/trie-prefix-tree/index.js";
function zip(arrays) {
  return arrays[0].map((_, i) => arrays.map((array) => array[i]));
}

function isHot() {
  $("#passPlay").text("Play");
  $("#swapRecall").text("Recall");
}

function isNot() {
  $("#passPlay").text("Pass");
  $("#swapRecall").text("Swap");
}

function validate(board, firstTurn) {
  try {
    !$(".column .hot").length ? isNot() : isHot();
    if (firstTurn && !board[7][7].letter.trim()) {
      throw "Error: Your word must touch an existing word or the center star";
    }
    let matrix = board.map((row) => row.map((obj) => obj.letter));
    let idMatrix = board.map((row) => row.map((obj) => obj.id));
    let hotMatrix = board.map((row) => row.map((obj) => obj.hot));

    let rows = matrix.map((row) => row.join(""));
    let columns = zip(matrix).map((column) => column.join(""));

    let idRows = idMatrix.map((row) => row.join(""));
    let idColumns = zip(idMatrix).map((column) => column.join(""));

    let hotRows = hotMatrix.map((row) => row.join(""));
    let hotColumns = zip(hotMatrix).map((column) => column.join(""));

    let ids = [];
    let words = [];
    let hotLetters = [];

    [...rows, ...columns].map((line) =>
      line.split(" ").map((word) => {
        if (word.length > 1) return words.push(word);
      })
    );

    [...idRows, ...idColumns].map((line) =>
      line.split(" ").map((id) => {
        if (ids.includes(id) && id !== board[7][7].id.trim()) {
          throw "(37) The letters you play must lie on the same row or column, and must be connected to each other";
        }
        if (id.length > 0) return ids.push(id);
      })
    );

    [...hotRows, ...hotColumns].map((line) =>
      line.split(" ").map((bool) => {
        if (hotLetters.length > 1) {
          throw "(47) The letters you play must lie on the same row or column, and must be connected to each other";
        }
        if (bool.length > 7) return hotLetters.push(bool.replaceAll("false", ""));
      })
    );

    if (ids.length == 2) throw `Word must contain at least two letters`;

    console.log(words);

    words.forEach((word) => {
      if (!Trie().hasWord(word)) throw `The word: '${word}' is INVALID `;
      //check words validity
    });
    return true;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export default validate;

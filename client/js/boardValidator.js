function zip(arrays) {
  return arrays[0].map((_, i) => arrays.map((array) => array[i]));
}

function validate(board, firstTurn = false) {
  if (firstTurn && !board[7][7].letter.trim()) {
    return console.log("Error: Your word must touch an existing word or the center star");
  }
  let matrix = board.map((row) => row.map((obj) => obj.letter));
  let idMatrix = board.map((row) => row.map((obj) => obj.id));

  let rows = matrix.map((row) => row.join(""));
  let columns = zip(matrix).map((column) => column.join(""));

  let idRows = idMatrix.map((row) => row.join(""));
  let idColumns = zip(idMatrix).map((column) => column.join(""));

  let ids = [];
  let words = [];
  let allLetters = [];

  [...rows, ...columns].map((line) =>
    line.split(" ").map((word) => {
      if (word.length > 0) allLetters.push(word);
      if (word.length > 1) return words.push(word);
    })
  );

  [...idRows, ...idColumns].map((line) =>
    line.split(" ").map((id) => {
      if (id.length > 1) return ids.push(id);
      if (firstTurn && id.length && !ids.length) return ids.push(id);
    })
  );

  if (allLetters.length == 2) {
    //check word validity
    //   return trie.hasWord(allLetters[0])
  }
  //   if (words[0].length == 1 && board[7][7].id.trim() !== ids[0]) {
  //     ids.shift();
  //     words.shift();
  //     // return console.log("Error: Your word must touch an existing word or the center star");
  //   }
  console.log(words);
  console.log(allLetters);
  //   console.log(ids);
}

export default validate;

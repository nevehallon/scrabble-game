const gridState = createGrid();

function createGrid() {
  let count = 0;
  let gridLetters = [];
  let gridMultipliers = [];

  for (let i = 0; i < 15; i++) {
    gridLetters.push([]);
    gridMultipliers.push([]);
    for (let j = 0; j < 15; j++) {
      let $element = document.querySelectorAll(".column")[count];
      // console.log($element);
      $element.setAttribute("data-location", `${i},${j}`);
      gridLetters[i].push("");
      // prettier-ignore
      gridMultipliers[i].push(
                $($element).hasClass("tw") ? 
                'tw' :
                $($element).hasClass("dw") ?
                "dw" :
                $($element).hasClass("tl") ?
                "tl" :
                $($element).hasClass("dl") ?
                "dl" : 
                1
            );
      ++count;
    }
  }

  return { gridLetters, gridMultipliers };
}

function updateGameState() {
  let count = 0;
  let gridLetters = [];

  for (let i = 0; i < 15; i++) {
    gridLetters.push([]);
    for (let j = 0; j < 15; j++) {
      let $element = document.querySelectorAll(".column")[count];
      // console.log($element);
      let letter;
      if ($($element).find(".tile").html()) letter = $($element).find(".tile").html().slice(0, 1);
      // prettier-ignore
      gridLetters[i].push(letter ? letter : "");
      ++count;
    }
  }

  gridState.gridLetters = gridLetters;
}

export { gridState, updateGameState };

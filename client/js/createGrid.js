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
      gridLetters[i].push(" ");
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
                " "
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
      if ($($element).find(".tile").html()) {
        letter = $($element).find(".tile").html().slice(0, 1);
      }
      // prettier-ignore
      let hot = letter ? $($element).find(".tile").hasClass("hot") : " ";
      let id = letter ? $($element).find(".tile").attr("data-drag") : " ";
      let pointVal = letter ? $($element).find(".tile div").html() : " ";
      gridLetters[i].push(letter ? { letter, id, pointVal, hot } : { letter: " ", id, pointVal, hot }); //possibly remove last hot prop
      ++count;
    }
  }

  gridState.gridLetters = gridLetters;
}

export { gridState, updateGameState };

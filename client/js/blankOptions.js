import letterToPoints from "./letterToPoints.js";

const letterToPointsSorted = letterToPoints.sort((a, b) => {
  a.letter === "BLANK" ? (a.letter = "") : a.letter;
  return b.letter > a.letter ? -1 : 1;
});

function generateOptions() {
  let modalContent = `
  <h5 class="mb-3">How would you like to use your blank tile?</h5>
  <div class="blankOptions">`;
  letterToPointsSorted.forEach((x, i) => {
    if (x.letter === "") return;
    modalContent += `
      <div>
        <div class="tile blankChoices">
        <i>
        ${x.letter}
        </i>
            <div>
            0
            </div>
        </div>
    </div>`;
  });

  modalContent += `</div>`;

  return modalContent;
}

export { generateOptions };

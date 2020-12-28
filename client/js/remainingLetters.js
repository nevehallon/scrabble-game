import letters from "./scrabbleLetters.js";
import letterToPoints from "./letterToPoints.js";

const lettersByFreq = _.countBy(letters, "letter");
const letterToPointsSorted = letterToPoints.sort((a, b) => {
  a.letter === "BLANK" ? (a.letter = "") : a.letter;
  return b.letter > a.letter ? -1 : 1;
});

function customizer(objValue, srcValue) {
  if (objValue) {
    return `${objValue}/${srcValue}`;
  }
  return `0/${srcValue}`;
}

function generateRemainder(bag) {
  let currentFreq = _.countBy(bag, "letter");

  _.mergeWith(currentFreq, lettersByFreq, customizer);

  let modalContent = `
  <h5 class="mb-3">Remaining Tiles in Bag:</h5>
  <div class="tilesLeft">`;
  letterToPointsSorted.forEach((x, i) => {
    modalContent +=
      `
      <div class="status-box">
        <div class="tile">
        ${x.letter === "" ? "*" : x.letter}
            <div>
            ${x.points}
            </div>
        </div>
        <span>` +
      currentFreq[`${x.letter === "BLANK" ? "" : x.letter}`] +
      `</span>
    </div>`;
  });

  modalContent += `</div>`;

  return modalContent;
}

export { generateRemainder };

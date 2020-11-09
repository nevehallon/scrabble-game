const gridState = createGrid();

function createGrid() {
    let count = 0;
    let gridLetters = [];
    let gridMultipliers = [];

    for (let i = 0; i < 15; i++) {
        gridLetters.push([]);
        gridMultipliers.push([]);
        for (let j = 0; j < 15; j++) {
            let $element = document.querySelectorAll('.square')[count];
            // console.log($element);
            $element.setAttribute('data-location', `${i},${j}`);
            gridLetters[i].push('');
            gridMultipliers[i].push($element.innerHTML ? $element.innerHTML : 1);
            ++count;
        }
    }

    return [{gridLetters}, {gridMultipliers}];
}
export default gridState;
function generateTable(history) {
  let modalContent = `
<h5 class="mb-5">Play History</h5>
<table class="table table-hover">
        <thead>
            <tr>
                <th scope="col"></th>
                <th scope="col">Opponent</th>
                <th scope="col">Player</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th scope="row">Start</th>
                <td>0</td>
                <td>0</td>
            </tr>`;
  history.forEach((x, i) => {
    let played = `${x.word} <b>[+${x.points}]</b>`;
    // prettier-ignore
    if(x.skip) {
        played = x.isAI ? 
        `<span class='text-danger'>${x.skip.isSwap ? "Swap" : "Pass"}</span>` :
        `<span class='text-primary'>${x.skip.isSwap ? "Swap" : "Pass"}</span>`;
    }
    modalContent += `<tr>
                        <th class="${x.isAI ? "text-danger" : "text-primary"}" scope="row">${played}</th>
                        <td class="${x.isAI ? "font-weight-bold" : ""} text-danger">${x.score.computerScore}</td>
                        <td class="${x.isAI ? "" : "font-weight-bold"} text-primary">${x.score.playerScore}</td>
                    </tr>`;
  });

  modalContent += `</tbody></table>`;

  return modalContent;
}

export { generateTable };

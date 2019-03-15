const url = new URL(window.location);
let seatCount = parseInt(url.searchParams.get('count'));
if (!seatCount) seatCount = 50;

let badGuys = parseInt(url.searchParams.get('bad'));
if (!badGuys) badGuys = 1;

for (let i = 0; i < seatCount; i++) {
    const cell1 = document.createElement('th');
    cell1.appendChild(document.createTextNode(`${i + 1}`));
    document.getElementById('wr_header').appendChild(cell1);
    const cell2 = document.createElement('td');
    cell2.setAttribute('id', `w_${i}`);
    cell2.setAttribute('class', `bg-info text-white`);
    cell2.addEventListener('mouseover', () => {
        document.getElementById(`t_${i}`).style.display = 'block';
    });
    cell2.addEventListener('mouseout', () => {
        document.getElementById(`t_${i}`).style.display = 'none';
    });
    document.getElementById('wr_body').appendChild(cell2);
}

for (let i = 0; i < seatCount; i++) {
    const div = document.createElement('div');
    div.setAttribute('id', `t_${i}`);
    div.setAttribute('class', 'hidden');
    div.appendChild(document.createTextNode(`Seat distribution for the ${i} guy`));
    const table = document.createElement('table');
    table.setAttribute('class', 'table');
    const thead = document.createElement('thead');
    thead.setAttribute('class', 'thead-dark');
    const tr1 = document.createElement('tr');
    for (let j = 0; j < seatCount; j++) {
        const th = document.createElement('th');
        th.appendChild(document.createTextNode(`${j + 1}`));
        tr1.appendChild(th);
    }
    thead.appendChild(tr1);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    const tr2 = document.createElement('tr');
    for (let j = 0; j < seatCount; j++) {
        const td = document.createElement('td');
        td.setAttribute('id', `d_${i}_${j}`);
        tr2.appendChild(td);
    }
    tbody.append(tr2);
    table.appendChild(tbody);
    div.appendChild(table);
    document.getElementById('tables').appendChild(div);
}

const blob = new Blob([
    `function getRandomNumbers(count) {
const array = new Uint32Array(count);
self.crypto.getRandomValues(array);
return array;
}

class Emulator {
constructor(seatCount, badGuys) {
this.seatCount = seatCount;
this.badGuys = badGuys;
this.randomNumbers = getRandomNumbers(seatCount);
this.availableSeats = new Array(seatCount);
for (let i = 0; i < seatCount; i++) this.availableSeats[i] = i;
this.seats = new Array(seatCount);
}

sit(step) {
if (step === this.seatCount) return;
if (step < this.badGuys || !this.availableSeats.includes(step)) {
    const index = this.randomNumbers[step] % this.availableSeats.length;
    this.seats[step] = this.availableSeats[index];
    this.availableSeats.splice(index, 1);
} else {
    this.seats[step] = step;
    const index = this.availableSeats.findIndex(element => element === step);
    this.availableSeats.splice(index, 1);
}

this.sit(step + 1);
}

test() {
this.sit(0);
return this.seats;
}
}

self.onmessage = (event) => {
const [seatCount, badGuys] = event.data;
const emulator = new Emulator(seatCount, badGuys);
postMessage(emulator.test());
};
`
], {
        type: 'application/javascript'
    });

let rounds = 0;
const seatWinCount = new Array(seatCount).fill(0);
const seatDistribution = new Array(seatCount);
for (let i = 0; i < seatCount; i++) {
    seatDistribution[i] = new Array(seatCount).fill(0);
}

function updateUI() {
    document.getElementById('rounds').innerText = rounds;
    seatWinCount.forEach((value, index) => {
        document.getElementById(`w_${index}`).innerText = (1.0 * value / rounds).toFixed(3);
    });
    seatDistribution.forEach((value, index) => {
        value.forEach((value1, index1) => {
            document.getElementById(`d_${index}_${index1}`).innerText = (1.0 * value1 / rounds)
                .toFixed(2);
        });
    });
    window.requestAnimationFrame(updateUI);
}

const workers = new Array(8).fill(new Worker(URL.createObjectURL(blob)));
workers.forEach(worker => {
    worker.onmessage = (event) => {
        const seats = event.data;
        seats.forEach((value, index) => {
            if (value === index) {
                seatWinCount[index] += 1;
            }
            seatDistribution[index][seats[index]] += 1;
        });
        rounds += 1;
        worker.postMessage([seatCount, badGuys]);
    };
    worker.postMessage([seatCount, badGuys]);
});

window.requestAnimationFrame(updateUI);
const blob = new Blob([`
class RandomNumberPool {
    
    constructor() {
        this.size = 1024;
        this.array = new Uint8Array(this.size);
        this.offset = 0;
        self.crypto.getRandomValues(this.array);
    }

    next() {
        if(this.offset === this.size) {
            self.crypto.getRandomValues(this.array);
            this.offset = 0;
        }
        return this.array[this.offset++];
    }
}

const randomNumberPool = new RandomNumberPool();
const ADJACENCY = {
    0: [1, 3, 4],
    1: [0, 2, 7],
    2: [1, 3, 6],
    3: [0, 2, 5],
    4: [0, 5, 7],
    5: [3, 4, 6],
    6: [2, 5, 7],
    7: [1, 4, 6]
};
const ORIGIN = 0;
const DESTINATION = 6;

function simulate(batch) {
    const costs = [];
    for (let i = 0; i < batch; i++) {
        let position = ORIGIN;
        let cost = 0;
        while (position !== DESTINATION) {
            let randomNumber = 0xff;
            while (randomNumber === 0xff) {
                randomNumber = randomNumberPool.next();
            } 
            const direction = randomNumber % 3;
            position = ADJACENCY[position][direction];
            cost += 1;
        }
        costs.push(cost);
    }
    return costs;
}

self.onmessage = event => {
    postMessage(simulate(event.data));
};
`], { type: 'application/javascript' });

class Panel extends React.Component {

    constructor(props) {
        super(props);
        this.batchSize = 1024;
        this.totalAntNumber = 0;
        this.totalCost = 0;
        this.biggestCost = 0;
        this.antsNumberPerCost = [];
        this.achievements = [],
            this.state = {
                startTime: new Date(),
                totalAntNumber: 0,
                totalCost: 0,
                antsNumberPerCost: {},
                achievements: []
            };
    }

    format(value) {
        if (value < 1e3) return `${value}`;
        if (value < 1e6) return `${(value / 1e3).toFixed(1)}K`;
        if (value < 1e9) return `${(value / 1e6).toFixed(1)}M`;
        return `${(value / 1e9).toFixed(1)}G`;
    }

    render() {
        return (
            <Reactstrap.Jumbotron>
                <h1 className="display-4">Ant Travel Problem Simulator</h1>
                <Reactstrap.Table>
                    <tr>
                        <td>A total of <b>{this.format(this.state.totalAntNumber)}</b> ants were dispatched to explore this problem (<b>{this.format(this.state.totalAntNumber / ((new Date() - this.state.startTime) / 1000))}</b> ants per seconds)</td>
                    </tr>
                    <tr>
                        <td>The desired cost is <b>{this.state.totalCost / this.state.totalAntNumber}</b></td>
                    </tr>
                    <tr>
                        <td>Ant number statistics for different costs</td>
                    </tr>
                    <tr>
                        <Recharts.BarChart width={800} height={300} data={this.state.antsNumberPerCost}>
                            <Recharts.CartesianGrid strokeDasharray="3 3" />
                            <Recharts.XAxis dataKey="cost" />
                            <Recharts.YAxis tickFormatter={this.format} />
                            <Recharts.Bar dataKey="number" fill="#8884d8" label={{ position: 'top' }} />
                        </Recharts.BarChart>
                    </tr>
                    <tr>
                        <td>
                            <p>Achievements</p>
                            <Reactstrap.ListGroup>
                                {this.state.achievements.map(a =>
                                    <Reactstrap.ListGroupItem>
                                        The first <b>{a.cost}</b> cost is achieved by the <b>{a.index.toLocaleString()}</b> ant
                                            </Reactstrap.ListGroupItem>
                                )}
                            </Reactstrap.ListGroup>
                        </td>
                    </tr>
                </Reactstrap.Table>
            </Reactstrap.Jumbotron>
        );
    }

    componentDidMount() {
        this.workers = new Array(8).fill(new Worker(URL.createObjectURL(blob)));
        this.workers.forEach((worker, index) => {
            worker.onmessage = (event) => {
                const costs = event.data;
                costs.forEach(cost => {
                    this.totalAntNumber += 1;
                    this.totalCost += cost;
                    if (this.antsNumberPerCost[cost] === undefined) {
                        this.antsNumberPerCost[cost] = 0;
                    }
                    this.antsNumberPerCost[cost] += 1;

                    if (cost > this.biggestCost) {
                        this.biggestCost = cost;
                        this.achievements.unshift({ cost, index: this.totalAntNumber });
                    }
                });
                this.setState(state => ({
                    totalAntNumber: this.totalAntNumber,
                    totalCost: this.totalCost,
                    antsNumberPerCost: this.antsNumberPerCost.map((number, cost) => ({
                        cost,
                        number
                    })).filter(i => i && i.cost < 50),
                    achievements: this.achievements
                }));
                worker.postMessage(this.batchSize);
            };
            worker.postMessage(this.batchSize);
        });
    }
}

ReactDOM.render(<Panel />, document.getElementById('root'));
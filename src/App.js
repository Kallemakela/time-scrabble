import './App.css';
import React, { Component } from 'react'
import Timer from 'react-compound-timer'

const INIT_TIME = 5*60*1000

export class App extends Component {

  state = {
    addPlayerEntry: '',
    paused: true,
    initTime: INIT_TIME,
    getTimeFn: () => INIT_TIME,
    pointEntry: '',
    showConfirm: false,
    timerFunctionsSet: false,
    turnCounter: 0,
    playerPoints: {}
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value })
  }

  addPlayer = (e) => {
    e.preventDefault()
    const { addPlayerEntry, playerPoints } = this.state
    const newPlayer = { [addPlayerEntry]: [] }
    this.setState({
      playerPoints: {...playerPoints, ...newPlayer },
      addPlayerEntry: '',
    })
  }

  toggleConfirm = () => {
      this.setState(prevState => ({ showConfirm: !prevState.showConfirm }))
  }

  // out of place reverse
  reverseArray = (arr) => {
    let newArray = []
    for (let i = arr.length - 1; i >= 0; i--) {
      newArray.push(arr[i])
    }
    return newArray
  }

  linearScoreFactor = () => {
    const timeSpent = INIT_TIME - this.state.getTimeFn()
    return 1 - (1 / INIT_TIME) * timeSpent
  }

  saveGame = () => {
    const { playerPoints, turnCounter } = this.state
    localStorage.setItem('playerPoints', JSON.stringify(playerPoints))
    localStorage.setItem('turnCounter', turnCounter)
  }

  loadGame = () => {
    const playerPointsStr = localStorage.getItem('playerPoints')
    const turnCounterStr = localStorage.getItem('turnCounter')    
    const playerPoints = playerPointsStr !== null ? JSON.parse(playerPointsStr) : {}
    const turnCounter = Number(turnCounterStr) || 0
    this.setState({
      playerPoints,
      turnCounter,
    })
  }

  clearPoints = () => {
    this.setState({
      playerPoints: {},
      turnCounter: 0,
      showConfirm: false,
    })
  }

  currentPlayer = () => {
    const { playerPoints, turnCounter } = this.state
    const playerIndex = turnCounter % Object.keys(playerPoints).length
    return Object.keys(playerPoints)[playerIndex]
  }

  pointEntry = (e) => {
    e.preventDefault()
    const { playerPoints, turnCounter, pointEntry, pauseFn, resetFn, getTimeFn } = this.state
    if (isNaN(pointEntry)) {
      return alert('Point entry must be a number')
    }
    if (Object.keys(playerPoints).length === 0) {
      return alert('Add a player to play the game')
    }
    if (getTimeFn() === INIT_TIME) {
      return alert('Start the timer')
    }
    const player = this.currentPlayer()
    const newPlayerPoints = {...playerPoints}
    const newPoint = Math.round(this.linearScoreFactor() * Number(pointEntry))
    newPlayerPoints[player] = [...playerPoints[player], newPoint]
    this.setState({
      playerPoints: newPlayerPoints,
      turnCounter: turnCounter + 1,
      pointEntry: '',
      paused: true,
    }, () => {
      this.saveGame()
      pauseFn()
      resetFn()
    })
  }

  padn = (timerObj, unit) => {
    const n = timerObj._owner.memoizedState[unit]
    return (n < 10) ? ('0' + n) : n
  }

  componentDidMount = () => {
    this.loadGame()
  }

  // TODO do this without hacks
  setFunctions = (startFn, pauseFn, resetFn, getTimeFn) => {
    if (!this.state.timerFunctionsSet) {
      this.setState({
        startFn,
        pauseFn,
        resetFn,
        getTimeFn,
        timerFunctionsSet: true,
      })
    }
  }

  render() {
    const {
      addPlayerEntry, paused, initTime, pointEntry, playerPoints, showConfirm
    } = this.state
    return (
      <div className='app'>

        <div className='add-player-form-cont'>
          <form action='' onSubmit={this.addPlayer} className='add-player-form'>
            <input
              type="text"
              id='addPlayerEntry'
              name='addPlayerEntry'
              value={addPlayerEntry}
              onChange={this.handleChange}
              placeholder='Player'
            />
            <input type="submit" value='Add player' />
          </form>
        </div>

        <Timer
            initialTime={initTime}
            timeToUpdate={200}
            direction="backward"
            startImmediately={false}
            lastUnit='m'
            checkpoints={[
                {
                    time: 0,
                    callback: () => alert('countdown finished'),
                },
            ]}
            onStart = {() => {
              this.setState({ paused: false })
            }}
            onPause = {() => {
              this.setState({ paused: true })
            }}
            onReset = {() => {
              this.setState({ paused: true })
            }}
        >
            {({ start, pause, reset, getTime }) => {
              this.setFunctions(start, pause, reset, getTime)
              return (
                <React.Fragment>
                    <div className='time'>
                      {this.padn(<Timer.Minutes />, 'm')}:
                      {this.padn(<Timer.Seconds />, 's')}
                    </div>
                    <div className='buttons'>
                      {paused ? (
                        <div className='start-btn-cont'>
                          <button onClick={start}>Start</button>
                        </div>
                      ) : (
                        <div className='pause-btn-cont'>
                          <button onClick={() => {
                            pause()
                          }}>Pause</button>
                        </div>
                      )}
                    <div className='reset-btn-cont'>
                      <button onClick={() => {
                          pause()
                          this.setState({ time: initTime })
                          reset()
                        }}>Reset</button>
                    </div>
                  </div>
                </React.Fragment>
            )}}
        </Timer>

        <div className='entry-points-form-cont'>
          <form action='' onSubmit={this.pointEntry} className='entry-points-form'>
            <input
              type="text"
              id='pointEntry'
              name='pointEntry'
              value={pointEntry}
              onChange={this.handleChange}
              placeholder='Points'
            />
            <input type="submit" value='Submit' />
          </form>
        </div>

        <div className='turn-cont'>
          {this.currentPlayer()}'s turn
        </div>

        <div className='score-cont'>
          {Object.keys(playerPoints).map(player => (
            <div className='player-score-cont' key={player}>
              <div className='player-name'>
                {player}
              </div>
              <div className='player-total-cont'>
                {playerPoints[player].reduce((s, x) => s+x, 0)}
              </div>
              <div className='player-point-cont'>
                {this.reverseArray(playerPoints[player]).map((n, i) => (
                  <div className='point' key={`point-${player}-${i}`}>
                    {n}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className='new-game-cont'>
          {showConfirm ? (
          <div className='confirm-buttons'>
            <button onClick={this.toggleConfirm}>No</button>
            <button onClick={this.clearPoints}>Yes</button>
          </div>
          )
          :
          ((<button onClick={this.toggleConfirm}>
            New Game
          </button>))}
        </div>

      </div>
    )
  }
}

export default App

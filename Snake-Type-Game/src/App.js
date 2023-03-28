import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
    PlayIcon,
    PauseIcon
} from "@heroicons/react/20/solid";

import {ArrowPathIcon, PlayPauseIcon} from "@heroicons/react/24/outline";
const randomXY = (snake, gameContainerWidth, gameContainerHeight) => {

  let goodSpot = true
  const randX = _.clamp(_.random(gameContainerWidth / 25) * 25, 25, gameContainerHeight - 25)
  const randY = _.clamp(_.random(gameContainerHeight / 25) * 25, 25, gameContainerHeight - 25)
  snake.segmentLocations.forEach((segment) =>{
    if (_.isEqual([randX, randY], segment)){
      goodSpot = false
    }})

  return goodSpot? [randX, randY]: randomXY(snake, gameContainerWidth, gameContainerHeight)

}

class GameContainer {

  constructor(width, height){
    this.width = width
    this.height = height
    this.wallCollision = false
    this.pause = true
  }

  update(snake, apple, score, setScore){
    // If the game is not Paused then update
    if (!this.pause){
      snake.update(apple, score, setScore)
      // check of snake collided with wall
      this.wallCollision = (snake.segmentLocations[0][0] >= this.width ||
          snake.segmentLocations[0][0] < 0 ||
          snake.segmentLocations[0][1] >= this.height ||
          snake.segmentLocations[0][1] < 0)?  true: false

      if (this.wallCollision){
        snake.resetSnake()
        score.current = 0
        this.pause = true
      }
    }
    if (snake.crashed){
      snake.resetSnake()
      score.current = 0
      this.pause = true
    }
  }

  stop(){
    this.pause = true
  }

  start(){
    this.pause = false
  }

}

class Snake {

  constructor()
  {
    this.segmentLocations = [[50,50], [25,50], [0,50]]
    this.head = this.segmentLocations[0]
    this.direction = "right"
    this.crashed = false
  }

  ateApple(apple){
    const didEatApple = (this.head[0] === apple.x && this.head[1] === apple.y)
    if(didEatApple){
      const [x, y] = randomXY(snake, 400, 400)
      apple.x = x
      apple.y = y
    }
    return didEatApple

  }

  resetSnake(){
    this.segmentLocations = [[50,50], [25,50], [0,50]]
    this.head = this.segmentLocations[0]
    this.direction = "right"
    this.crashed = false
  }

  checkIfCrashed(){
    this.segmentLocations.slice(1,).forEach((segment) =>{
      if (_.isEqual(this.head, segment)){
        this.crashed = true
      }})
  }

  update(apple, score){

    if (!this.crashed){
      let currentHead
      if (this.direction === "right"){
        currentHead = [this.head[0] + 25, this.head[1]]
      }
      else if (this.direction === "left"){
        currentHead = [this.head[0] - 25, this.head[1]]
      }
      else if (this.direction === "up"){
        currentHead = [this.head[0], this.head[1] - 25]
      }
      else if (this.direction === "down"){
        currentHead = [this.head[0], this.head[1] + 25]
      }
      this.head = currentHead
      this.segmentLocations = [currentHead].concat(this.segmentLocations)


      if (!this.ateApple(apple)){
        this.segmentLocations.pop()
      }
      else{
        score.current = score.current + 1
      }
      this.checkIfCrashed()
    }

  }
  changeDirection(direction){
    this.direction = direction
  }
}

class Apple {
  constructor(location)
  {
    this.x = location.x
    this.y = location.y
  }
}

const Button = (props) => {
  return(
      <div
          onClick={props.function}
           className={`flex-none bg-${props.color} w-12 h-12 border rounded-sm shadow hover:shadow-none duration-200 cursor-grab`}>

        {props.children}
      </div>
  )
}

const gameContainer = new GameContainer(400, 400)
const snake = new Snake()
const apple = new Apple({x:100, y:100})

const Game = ({gameContainer, snake, apple}) => {

  const canvasRef = useRef(null)
  const score = useRef(0)
  const updateGameState = (gameContainer, snake, apple, ctx, score) => {

    // Update gameContainer
    gameContainer.update(snake, apple, score)
    if (!gameContainer.wallCollision && !snake.crashed && !gameContainer.pause){
      // Draw Game Container
      ctx.clearRect(0,0, gameContainer.width, gameContainer.height)
      ctx.fillStyle = '#134e4a';
      ctx.fillRect(0, 0, gameContainer.x, gameContainer.y)
      // Draw Snake
      ctx.fillStyle = '#16a34a';
      ctx.strokeStyle = '#064e3b'
      for (let index = 0; index < snake.segmentLocations.length; index++) {
        const segment = snake.segmentLocations[index]
        ctx.fillRect(segment[0], segment[1], 25, 25);
        ctx.strokeRect(segment[0], segment[1], 25, 25)
      }
      // Draw Apple
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = "#7f1d1d"
      ctx.fillRect(apple.x, apple.y, 25, 25)
      ctx.strokeRect(apple.x, apple.y, 25, 25)
      // Draw Score
      ctx.fillStyle = '#1e293b';
      ctx.font = "30px Arial";
      ctx.fillText(` ${score.current}`, 2, 32);
    }
    else if (gameContainer.wallCollision){

    }

  }

  const controller = (event) => {

    switch (event.code) {
      case "ArrowRight":
        snake.changeDirection("right")
        break
      case "ArrowLeft":
        snake.changeDirection("left")
        break
      case "ArrowUp":
        snake.changeDirection("up")
        break
      case "ArrowDown":
        snake.changeDirection("down")
        break
      default:
        break;
    }
    switch (event.keyCode ) {
      case 32:
        gameContainer.stop()
        break
      case 13:
        gameContainer.start()
        break
      default:
        break;
    }
  }

  useEffect(() => {

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d");
    const scale = window.devicePixelRatio;
    const size = 400
    canvas.width = Math.floor(size * scale);
    canvas.height = Math.floor(size * scale);
    ctx.scale(scale, scale);

    let gameState = setInterval(() => {updateGameState(gameContainer, snake, apple, ctx, score);}, 150)
    window.addEventListener('keydown', controller);

    return () => {
      clearInterval(gameState)
      window.removeEventListener('keydown', controller);
    }
  })
  return(
      <div className={"w-screen h-screen py-7 bg-slate-100"}>
        <div className={"flex flex-col items-center gap-y-12 justify-center h-full"}>
          <canvas
              className={'border shadow bg-white  w-5/6 sm:w-1/3'}
              id="myCanvas"
              ref={canvasRef}>
          </canvas>
          <div className={"flex flex-row gap-x-16"} >
            <div className="text-slate-700 flex flex-col gap-1">
              <div className={"flex flex-row gap-x-1"} >
                <div className={"flex-none w-12 h-12"}></div>

                <Button color={"white"} function={() => snake.changeDirection("up")} >{<ChevronUpIcon/>}</Button>
                {/*<div className={"w-10 h-10 flex-none"}></div>*/}

                <div className={"w-12 h-12 flex-none"}></div>
              </div>
              <div className={"flex flex-row gap-x-1"} >
                <Button color={"white"} function={() => snake.changeDirection("left")} >{<ChevronLeftIcon/>}</Button>
                <div className={"flex-none w-12 h-12"}>
                  <Button color={"white"} function={() => snake.changeDirection("down")} >{<ChevronDownIcon/>}</Button>
                </div>
                <Button color={"white"} function={() => snake.changeDirection("right")} >{<ChevronRightIcon/>}</Button>
              </div>

            </div>

            <div className="text-slate-700 flex flex-row gap-1">
              <div
                  onClick={() => gameContainer.start()}
                  className={"bg-white w-12 grid content-center justify-center h-12 border rounded-sm shadow hover:shadow-none duration-200 cursor-grab p-2"}>
                <PlayIcon width={20} /></div>
              <div
                  onClick={() => gameContainer.stop()}
                  className={"bg-white w-12 h-12 border rounded-sm shadow hover:shadow-none duration-200 cursor-grab p-1 flex flex-row justify-center align-middle content-center"}>
                <PauseIcon width={20} />
              </div>
            </div>
          </div>
        </div>






        {/*<table >*/}
        {/*  <tr>*/}
        {/*    <th>Command</th>*/}
        {/*    <th>Key</th>*/}
        {/*  </tr>*/}
        {/*  <tr>*/}
        {/*    <td>Stop</td>*/}
        {/*    <td>Space Bar</td>*/}
        {/*  </tr>*/}
        {/*  <tr>*/}
        {/*    <td>Continue</td>*/}
        {/*    <td>Enter</td>*/}
        {/*  </tr>*/}
        {/*  <tr>*/}
        {/*    <td>Left</td>*/}
        {/*    <td>Left Arrow</td>*/}
        {/*  </tr>*/}
        {/*  <tr>*/}
        {/*    <td>Right</td>*/}
        {/*    <td>Right Arrow</td>*/}
        {/*  </tr>*/}
        {/*  <tr>*/}
        {/*    <td>Up</td>*/}
        {/*    <td>Up Arrow</td>*/}
        {/*  </tr>*/}
        {/*  <tr>*/}
        {/*    <td>Down</td>*/}
        {/*    <td>Down Arrow</td>*/}
        {/*  </tr>*/}
        {/*</table>*/}

        {/*<div*/}
        {/*    onClick={() => window.location.reload()}*/}
        {/*    >*/}
        {/*  <div*/}
        {/*      className={"border m-10 cursor-grab text-lg"}*/}

        {/*  > New Game*/}
        {/*  </div>*/}
        {/*</div>*/}
      </div>
  )
}

function App() {
  return (
    <>
      <Game gameContainer={gameContainer} snake={snake} apple={apple}/>
    </>
  );
}

export default App;

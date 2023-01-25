import Head from "next/head";
import Script from "next/script";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { GrClose } from "react-icons/gr";
import { Square } from "react-chessboard/dist/chessboard/types";
import { Engine } from "../utils/wukong";
import { BiBrain } from "react-icons/bi";

import {
	FaChessBishop,
	FaChessKnight,
	FaChessRook,
	FaChessQueen,
} from "react-icons/fa";

interface Move {
	from: Square;
	to: Square;
	promotion?: string;
}

interface Modal {
	title: string;
	message: string;
	type: "success" | "error";
}

export default function Home() {
	const [game, setGame] = useState<Chess>(new Chess());
	const [modals, setModal] = useState<Modal[]>([]);
	const [promoting, setPromoting] = useState(false);
	const [thinking, setThinking] = useState(false);
	const [depth, setDepth] = useState(4);
	const [mousePos, setMousePos] = useState<{
		x: number;
		y: number;
		move: Move;
	}>({
		x: 0,
		y: 0,
		move: { from: "a1", to: "a2" },
	});

	function makeAMove(move: Move, promote?: string, obj?: Chess) {
		let temp = new Chess();
		if (obj) {
			temp.loadPgn(obj.pgn());
		} else {
			temp.loadPgn(game.pgn());
		}
		if (!promote) {
			if (
				temp.get(move.from).type === "p" &&
				temp.get(move.from).color === "w" &&
				move.to[1] === "8"
			) {
				let e = window?.event as MouseEvent;
				setPromoting(true);
				setMousePos({
					x: e.clientX,
					y: e.clientY,
					move: move,
				});
				return;
			}
			if (
				temp.get(move.from).type === "p" &&
				temp.get(move.from).color === "b" &&
				move.to[1] === "1"
			) {
				let e = window?.event as MouseEvent;
				setPromoting(true);
				setMousePos({
					x: e.clientX,
					y: e.clientY,
					move: move,
				});
				return;
			}
		}
		if (promote) {
			setPromoting(false);
			move.promotion = promote;
		}

		let result = temp.move(move);
		console.log(move);
		if (result) {
			setGame(temp);
		}
		if (temp.isCheckmate()) {
			setModal((prev) => [
				...prev,
				{
					title: "Game Over",
					message: "Checkmate",
					type: "success",
				},
			]);
			setTimeout(() => {
				setModal((prev) => prev.filter((_, index) => index !== 0));
			}, 5000);
		}
		if (temp.isStalemate()) {
			setModal((prev) => [
				...prev,
				{
					title: "Game Over",
					message: "Draw by Stalemate",
					type: "success",
				},
			]);
			setTimeout(() => {
				setModal((prev) => prev.filter((_, index) => index !== 0));
			}, 5000);
		}
		if (temp.isInsufficientMaterial()) {
			setModal((prev) => [
				...prev,
				{
					title: "Game Over",
					message: "Draw by Insufficient Material",
					type: "success",
				},
			]);
			setTimeout(() => {
				setModal((prev) => prev.filter((_, index) => index !== 0));
			}, 5000);
		}
		if (!result) {
			setModal((prev) => [
				...prev,
				{
					title: "Invalid Move",
					message: "You can't make that move",
					type: "error",
				},
			]);
			setTimeout(() => {
				setModal((prev) => prev.filter((_, index) => index !== 0));
			}, 5000);
		}
		return { move: result, temp: temp };
	}

	const aiMove = (res?: Chess) => {
		const engine = new (Engine as any)();
		engine.setBoard(res?.fen());
		let rawMove = engine.search(depth);
		let strMove = engine.moveToString(rawMove);
		let move = {
			from: strMove.substring(0, 2),
			to: strMove.substring(2, 4),
		};
		setThinking(false);
		makeAMove(move, "", res);
	};

	function onDrop(sourceSquare: Square, targetSquare: Square) {
		const res = makeAMove({
			from: sourceSquare,
			to: targetSquare,
			//promotion: "q", // always promote to a queen for example simplicity
		});

		// illegal move
		if (res?.move === null) return false;
		//make a move here
		setThinking(true);
		setTimeout(() => aiMove(res?.temp), 200);
		return true;
	}

	const onPiece = (piece: string) => {
		console.log(piece);
	};

	return (
		<div>
			<Head>
				<title>Chess</title>
				<meta name="description" content="Generated by create next app" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className="fixed right-5 top-5 flex flex-col gap-3">
				{[...modals].reverse().map(({ title, message, type }, i) => (
					<div
						role="alert"
						className={`rounded border-l-4 $ ${
							type === "error" ? "border-red-500" : "border-green-500"
						} bg-red-50 p-4 cursor-pointer`}
						key={i}
						onClick={() => {
							setModal((prev) => prev.filter((_, index) => index !== i));
						}}
					>
						<strong
							className={`block font-medium ${
								type === "error" ? "text-red-700" : "text-green-700"
							}`}
						>
							{title}
						</strong>

						<p
							className={`mt-2 text-sm ${
								type === "error" ? "text-red-700" : "text-green-700"
							}`}
						>
							{message}
						</p>
					</div>
				))}
			</div>
			<h1 className="text-center text-white text-5xl font-bold p-10">Chess</h1>
			<div className="flex justify-center gap-10">
				<div id="chessboard" className="hidden"></div>
				<div className="w-96">
					<Chessboard
						position={game.fen()}
						onPieceDrop={onDrop}
						onPieceClick={onPiece}
						customBoardStyle={{ borderRadius: "5px" }}
						customDarkSquareStyle={{ backgroundColor: "#59b5a6" }}
						customLightSquareStyle={{ backgroundColor: "#9de0b0" }}
					/>

					<label
						htmlFor="minmax-range"
						className="block mt-3 text-sm text-gray-900 dark:text-white"
					>
						Depth of AI (Higher Depth = More Time = More Difficult)
					</label>
					<input
						id="minmax-range"
						type="range"
						min="1"
						max="10"
						value={depth}
						onChange={(e) => setDepth(parseInt(e.target.value))}
						className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
					/>

					{thinking && (
						<p className="animate-pulse flex gap-1 text-center pt-5 justify-center items-center text-white">
							<BiBrain />
							AI is Thinking...
						</p>
					)}
				</div>
				<div className="flex gap-5 px-5 h-96 overflow-auto">
					<div>
						<h3 className="text-white text-xl font-semibold">White</h3>
						<ol className="list-decimal list-inside">
							{game
								.history()
								.filter((move, i) => i % 2 === 0)
								.map((move, i) => (
									<li key={i} className="text-white">
										{move.toString()}
									</li>
								))}
						</ol>
					</div>
					<div>
						<h3 className="text-white text-xl font-semibold">Black</h3>
						<ol className="list-decimal list-inside">
							{game
								.history()
								.filter((move, i) => i % 2 !== 0)
								.map((move, i) => (
									<li key={i} className="text-white">
										{move.toString()}
									</li>
								))}
						</ol>
					</div>
				</div>
			</div>
			{promoting && (
				<div
					className="rounded-lg bg-white bg-opacity-75 p-3 max-w-max absolute z-10"
					style={{ top: mousePos.y, left: mousePos.x }}
				>
					<p className="text-center pb-2">Select Piece</p>
					<div className="flex flex-wrap gap-3 text-white">
						<button
							className="p-3 bg-black	 rounded-lg"
							onClick={() => makeAMove(mousePos.move, "b")}
						>
							<FaChessBishop />
						</button>
						<button
							className="p-3 bg-black	 rounded-lg"
							onClick={() => makeAMove(mousePos.move, "n")}
						>
							<FaChessKnight />
						</button>
						<button
							className="p-3 bg-black	 rounded-lg"
							onClick={() => makeAMove(mousePos.move, "r")}
						>
							<FaChessRook />
						</button>
						<button
							className="p-3 bg-black	 rounded-lg"
							onClick={() => makeAMove(mousePos.move, "q")}
						>
							<FaChessQueen />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

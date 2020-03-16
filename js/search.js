var SearchController = {};

SearchController.nodes;
SearchController.fh;
SearchController.fhf;
SearchController.depth;
SearchController.time;
SearchController.start;
SearchController.stop;
SearchController.best;
SearchController.thinking;

function ClearPvTable() {
	
	for(index = 0; index < PVENTRIES; index++) {
			GameBoard.PvTable[index].move = NOMOVE;
			GameBoard.PvTable[index].posKey = 0;		
	}
}

function CheckUp() {
	if (( $.now() - SearchController.start ) > SearchController.time) {
		SearchController.stop == BOOL.TRUE;
	}
}

function IsRepetition() {
	var index = 0;
	
	for(index = GameBoard.hisPly - GameBoard.fiftyMove; index < GameBoard.hisPly - 1; ++index) {
		if(GameBoard.posKey == GameBoard.history[index].posKey) {
			return BOOL.TRUE;
		}
	}
	
	return BOOL.FALSE;
}

function AlphaBeta(alpha, beta, depth) {

	SearchController.nodes++;
	if(depth <= 0) {
		return EvalPosition();
	}
	
	if ((SearchController.nodes & 2047) == 0) {
		CheckUp();
	}
	
	
	
	if( (IsRepetition() || GameBoard.fiftyMove >= 100) && GameBoard.ply != 0) {
		return 0;
	}
	
	if(GameBoard.ply > MAXDEPTH -1) {
		return EvalPosition();
	}	
	
	var InCheck = SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side],0)], GameBoard.side^1);
	if(InCheck == BOOL.TRUE)  {
		depth++;
	}	
	
	var Score = -INFINITE;
	
	GenerateMoves();
	
	var MoveNum = 0;
	var Legal = 0;
	var OldAlpha = alpha;
	var BestMove = NOMOVE;
	var Move = NOMOVE;
	
	/* Get PvMove */
	/* Order PvMove */	
	
	for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum) {
	
		/* Pick Next Best Move */
		
		Move = GameBoard.moveList[MoveNum];	

		if(MakeMove(Move) == BOOL.FALSE) {
			continue;
		}		
		Legal++;
		Score = -AlphaBeta( -beta, -alpha, depth-1);
		
		TakeMove();
		
		if(SearchController.stop == BOOL.TRUE) {
			return 0;
		}
		
		if(Score > alpha) {
			if(Score >= beta) {
				if(Legal == 1) {
					SearchController.fhf++;
				}
				SearchController.fh++;				
				/* Update Killer Moves */
				
				return beta;
			}
			alpha = Score;
			BestMove = Move;
			/* Update History Table */
		}		
	}	
	
	if(Legal == 0) {
		if(InCheck == BOOL.TRUE) {
			return -MATE + GameBoard.ply;
		} else {
			return 0;
		}
	}	
	
	if(alpha != OldAlpha) {
		StorePvMove(BestMove);
	}
	
	return alpha;
}

function ClearForSearch() {

	var index = 0;
	var index2 = 0;
	
	for(index = 0; index < 14 * BRD_SQ_NUM; ++index) {		
		GameBoard.searchHistory[index] = 0;	
	}
	
	for(index = 0; index < 3 * MAXDEPTH; ++index) {
		GameBoard.searchKillers[index] = 0;
	}	
	
	ClearPvTable();
	GameBoard.ply = 0;
	SearchController.nodes = 0;
	SearchController.fh = 0;
	SearchController.fhf = 0;
	SearchController.start = $.now();
	SearchController.stop = BOOL.FALSE;
}

function SearchPosition() {

	var bestMove = NOMOVE;
	var bestScore = -INFINITE;
	var currentDepth = 0;
	var line;
	var PvNum;
	var c;
	ClearForSearch();
	
	for( currentDepth = 1; currentDepth <= /*SearchController.depth*/ 5; ++currentDepth) {	
	
		bestScore = AlphaBeta(-INFINITE, INFINITE, currentDepth);
					
		if(SearchController.stop == BOOL.TRUE) {
			break;
		}
		
		bestMove = ProbePvTable();
		line = 'D:' + currentDepth + ' Best:' + PrMove(bestMove) + ' Score:' + bestScore + 
				' nodes:' + SearchController.nodes;
				
		PvNum = GetPvLine(currentDepth);
		line += ' Pv:';
		for( c = 0; c < PvNum; ++c) {
			line += ' ' + PrMove(GameBoard.PvArray[c]);
		}
		console.log(line);
						
	}
	
	
	SearchController.best = bestMove;
	SearchController.thinking = BOOL.FALSE;

}
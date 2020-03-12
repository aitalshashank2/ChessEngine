function PCEINDEX(pce, pceNum){
    return (pce*10+pceNum);
}

var GameBoard = {};

GameBoard.pieces = new Array(BRD_SQ_NUM);
GameBoard.side = COLOURS.WHITE;
GameBoard.fiftyMove = 0;  // 50 move draw verification
GameBoard.hisPly = 0;  //rewind
GameBoard.ply = 0;  //moves in the search tree
GameBoard.enPas = 0; //enPassant


// 0001 : WKCA
// 0010 : WQCA
// 0100 : BKCA
// 1000 : BQCA

// 1101 is black has permission to castle on both sides but white has only on king side
//Evaluated by bitwise and

GameBoard.castlePerm = 0;  //does the player have permission to castle (is the king being attacked, etc.)
GameBoard.material = new Array(2); //Piece material

GameBoard.pceNum = new Array(13); //indexed by pce,,, number of pieces
GameBoard.pList = new Array(14*10); //Stores the square on which pieces exist
GameBoard.posKey = 0;  //XOR Random piece keys to form position key of the game on board

GameBoard.moveList = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveScores = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveListStart = new Array(MAXDEPTH);

function PrintBoard(){
    var sq, file, rank, piece;

    console.log("\nGame Board:\n");
    for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--){
        var line = (RankChar[rank] + "  ");
        for(file = FILES.FILE_A; file <= FILES.FILE_H; file++){
            sq = FR2SQ(file,rank);
            piece = GameBoard.pieces[sq];
            line += (" " + PceChar[piece] + " ");

        }
        console.log(line);
    }

    console.log("");
    var line= "   ";
    for(file = FILES.FILE_A; file <= FILES.FILE_H; file++){
        line += (' ' + FileChar[file] + ' ');
    }
    console.log(line);
    
    console.log("side: " + SideChar[GameBoard.side]);
    console.log("enPas: " + GameBoard.enPas);
    
    //Castle Permission
    line = "";
    if(GameBoard.castlePerm & CASTLEBIT.WKCA) line += "K";
    if(GameBoard.castlePerm & CASTLEBIT.WQCA) line += "Q";
    if(GameBoard.castlePerm & CASTLEBIT.BKCA) line += "k";
    if(GameBoard.castlePerm & CASTLEBIT.BQCA) line += "q";
    console.log("castle: " + line);

    console.log("key: " + GameBoard.posKey.toString(16));
    
}

function GeneratePosKey(){

    var sq = 0;
    var finalKey = 0;
    var piece = PIECES.EMPTY;

    for(sq = 0; sq < BRD_SQ_NUM; ++sq){
        piece = GameBoard.pieces[sq];
        if(piece != PIECES.EMPTY && piece != SQUARES.OFFBOARD){
            finalKey ^= PieceKeys[(piece*120) + sq];
        }
    }

    if(GameBoard.side == COLOURS.WHITE){
        finalKey ^= SideKey;
    }

    if(GameBoard.enPas != SQUARES.NO_SQ){
        finalKey ^= PieceKeys[GameBoard.enPas];
    }

    finalKey ^= CastleKeys[GameBoard.castlePerm];

    return finalKey;
}

function PrintPieceLists(){
    var piece, pceNum;

    for(piece = PIECES.wP; piece <= PIECES.bK; piece++){
        for(pceNum = 0; pceNum < GameBoard.pceNum[piece]; pceNum++){
            console.log("Piece " + PceChar[piece] + " on " + PrSq(GameBoard.pList[PCEINDEX(piece,pceNum)]));
        }
    }
}

function UpdateListsMaterial(){

    var piece, sq, index, colour;

    for(index = 0; index <= 14*10; ++index){
        GameBoard.pList[index] = PIECES.EMPTY;
    }

    for(index = 0; index < 2; ++index){
        GameBoard.material[index] = 0;
    }

    for(index = 0; index < 13; ++index){
        GameBoard.pceNum[index] = 0;
    }

    for(index = 0; index < 64; ++index){
        sq = SQ120(index);
        piece = GameBoard.pieces[sq];
        if(piece != PIECES.EMPTY){
            colour = PieceCol[piece];

            GameBoard.material[colour] += PieceVal[piece];

            GameBoard.pList[PCEINDEX(piece,GameBoard.pceNum[piece])] = sq;
            GameBoard.pceNum[piece]++;
        }
    }

}

function ResetBoard(){
    var index = 0;

    for(index = 0; index < BRD_SQ_NUM; ++index){
        GameBoard.pieces[index] = SQUARES.OFFBOARD;
    }

    for(index = 0; index < 64; ++index){
        GameBoard.pieces[SQ120(index)] = PIECES.EMPTY;
    }

    GameBoard.side = COLOURS.BOTH;
    GameBoard.enPas = SQUARES.NO_SQ;
    GameBoard.fiftyMove = 0;
    GameBoard.ply = 0;
    GameBoard.hisPly = 0;
    GameBoard.castlePerm = 0;
    GameBoard.posKey = 0;
    GameBoard.moveListStart[GameBoard.ply] = 0;
}

function ParseFen(fen){

    ResetBoard();
    
    //Ranks(8->1)    colour_to_play    castle_permissions    enPassant_legal_squares    50_move_draw    /*something else*/

    var rank = RANKS.RANK_8;
    var file = FILES.FILE_A;
    var piece = 0;
    var count = 0;
    var i = 0;
    var sq120 = 0;
    var fenCnt = 0;

    while((rank >= RANKS.RANK_1) && (fenCnt < fen.length)){
        count = 1;
        switch(fen[fenCnt]){
            case 'p': piece = PIECES.bP; break;
            case 'r': piece = PIECES.bR; break;
            case 'n': piece = PIECES.bN; break;
            case 'b': piece = PIECES.bB; break;
            case 'k': piece = PIECES.bK; break;
            case 'q': piece = PIECES.bQ; break;

            case 'P': piece = PIECES.wP; break;
            case 'R': piece = PIECES.wR; break;
            case 'N': piece = PIECES.wN; break;
            case 'B': piece = PIECES.wB; break;
            case 'K': piece = PIECES.wK; break;
            case 'Q': piece = PIECES.wQ; break;


            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
                piece = PIECES.EMPTY;
                count = fen[fenCnt].charCodeAt() - '0'.charCodeAt();
                break;
            
            
            case '/':
            case ' ':
                rank--;
                file = FILES.FILE_A;
                fenCnt++;
                continue;

            default:
                console.log("FEN error");
                return;
        }

        for(i = 0; i < count; i++){
            sq120 = FR2SQ(file,rank);
            GameBoard.pieces[sq120] = piece;
            file++;
        }
        fenCnt++;
    }

    //Set colour

    GameBoard.side = (fen[fenCnt] == 'w')?COLOURS.WHITE:COLOURS.BLACK;
    fenCnt+=2;

    for(i = 0; i < 4; i++){
        if(fen[fenCnt] == ' '){
            break;
        }

        switch(fen[fenCnt]){
            case 'K': GameBoard.castlePerm |= CASTLEBIT.WKCA; break;
            case 'Q': GameBoard.castlePerm |= CASTLEBIT.WQCA; break;
            case 'k': GameBoard.castlePerm |= CASTLEBIT.BKCA; break;
            case 'q': GameBoard.castlePerm |= CASTLEBIT.BQCA; break;
            default: break;
        }

        fenCnt++;
    }

    fenCnt++;

    if(fen[fenCnt] != '-'){
        file = fen[fenCnt].charCodeAt() - 'a'.charCodeAt();
        rank = fen[fenCnt + 1].charCodeAt() - '0'.charCodeAt();
        console.log(file + ", " + rank);
        GameBoard.enPas = FR2SQ(file,rank);
    }

    GameBoard.posKey = GeneratePosKey();
    UpdateListsMaterial();
    PrintPieceLists();
}
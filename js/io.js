function PrSq(sq){
    return (FileChar[FilesBrd[sq]] + RankChar[RanksBrd[sq]]);
}

function PrMove(move){
    // e2e6
    // promotion e2e8q

    var MvStr;

    var ff = FilesBrd[FROMSQ(move)]; // file from
    var rf = RanksBrd[FROMSQ(move)]; // rank from
    var ft = FilesBrd[TOSQ(move)];   // file to
    var rt = RanksBrd[TOSQ(move)];   // rank to

    MvStr = FileChar[ff] + RankChar[rf] + FileChar[ft] + RankChar[rt];

    var promoted = PROMOTED(move);

    if(promoted != PIECES.EMPTY){
        var pchar = 'q';
        if(PieceKnight[promoted] == BOOL.TRUE){
            pchar = 'n';
        }else if(PieceBishopQueen[promoted] == BOOL.TRUE && PieceRookQueen[promoted] == BOOL.FALSE){
            pchar = 'b';
        }else if(PieceRookQueen[promoted] == BOOL.TRUE && PieceBishopQueen[promoted] == BOOL.FALSE){
            pchar = 'r';
        }
        MvStr += pchar;
    }
    return MvStr;
}

function PrintMoveList(){

    var index;
    var move;
    console.log("MoveList:");

    for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply + 1]; index++){
        move = GameBoard.moveList[index];
        console.log(PrMove(move));
    }

}
import React from "react";

const MatchupCard = ({
  obj,
  deleteObject,
  toggleTag,
  moveUp,
  shiftIndex,
  shiftNum,
}) => {
  return (
    <div className="matchupcard">
      <p>{obj.data.rank}.</p>
      <h2>{obj.data.name}</h2>
      <button onClick={() => deleteObject(obj)}>X</button>
      <button onClick={() => toggleTag(obj)}>tag</button>
      <button
        onClick={() => {
          shiftNum === 1 && moveUp(obj);
          shiftIndex(1);
        }}
      >
        &uarr;
      </button>
    </div>
  );
};

export default MatchupCard;

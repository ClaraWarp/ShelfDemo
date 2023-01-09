import { useEffect } from "react";

const TagTieCard = ({ tiedObjs }) => {
  useEffect(() => {
    console.log(tiedObjs);
  }, []);

  const buttonRendersLinks = (tag) => {
    return { __html: tag };
  };

  const stringToColour = function (str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = "#";
    for (let i = 0; i < 3; i++) {
      let value = (hash >> (i * 8)) & 0xff;
      colour += ("00" + value.toString(16)).substr(-2);
    }
    return addAlpha(colour, 0.3);
  };

  function addAlpha(color, opacity) {
    // coerce values so ti is between 0 and 1.
    var _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
    return color + _opacity.toString(16).toUpperCase();
  }

  return (
    <div className="tagtiecard">
      {tiedObjs[1].data.tags
        .filter(
          (tag) => tiedObjs[0].data.tags.includes(tag) === false && { tag }
        )
        .map((tag, i) => (
          <button
            key={i}
            dangerouslySetInnerHTML={buttonRendersLinks(tag)}
            style={{ backgroundColor: stringToColour(tag) }}
          ></button>
        ))}
      <p>------------------------------------</p>
      {tiedObjs[1].data.tags
        .filter((tag) => tiedObjs[0].data.tags.includes(tag) && { tag })
        .map((tag, i) => (
          <button key={i} style={{ backgroundColor: stringToColour(tag) }}>
            {tag}
          </button>
        ))}
      <p>------------------------------------</p>
      {tiedObjs[0].data.tags
        .filter(
          (tag) => tiedObjs[1].data.tags.includes(tag) === false && { tag }
        )
        .map((tag, i) => (
          <button
            key={i}
            dangerouslySetInnerHTML={buttonRendersLinks(tag)}
            style={{ backgroundColor: stringToColour(tag) }}
          ></button>
        ))}
    </div>
  );
};

export default TagTieCard;

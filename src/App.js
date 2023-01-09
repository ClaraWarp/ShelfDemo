import "./App.css";
import { useState, useEffect } from "react";
import db from "./firebase";
import {
  doc,
  query,
  writeBatch,
  where,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import MatchupCard from "./components/MatchupCard";
import TagTieCard from "./components/TagTieCard";

function App() {
  const [shelfObjects, setShelfObjects] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    tags: [],
  });
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showMatchup, setShowMatchup] = useState(false);
  const [matchupIndex, setMatchupIndex] = useState(0);
  const [filterFormData, setFilterFormData] = useState({
    filterTags: [],
  });
  const [showFilterForm, setShowFilterForm] = useState(false);

  useEffect(() => {
    db.collection("shelfObjects").onSnapshot((snapshot) => {
      setShelfObjects(
        snapshot.docs.map((doc) => {
          return {
            data: doc.data(),
            id: doc.id,
          };
        })
      );
    });
    printTodos();
  }, []);

  const randomizeMatchupIndex = () => {
    setMatchupIndex(Math.floor(Math.random() * shelfObjects.filter(filterResult).length));
  };

  const filterResult = (obj) => {
    const nonEmptyTags = filterFormData.filterTags.filter(tag => tag !== '');
    return nonEmptyTags.every(filterTag => obj.data.tags.includes(filterTag));
  }

  const printTodos = async () => {
    const q = query(
      collection(db, "shelfObjects"),
      where("tags", "array-contains", "todo")
    );
    const querySnapshot = await getDocs(q);
    console.log(`START--COPY-AFTER-HERE-->`);
    const arr = [];
    querySnapshot.forEach((doc) => {
      arr.push(doc.data());
    });
    console.log(
      arr.sort((a, b) => {
        return a.rank > b.rank ? 1 : -1;
      })
    );
  };

  // Function to add a tag input to the form
  const addTagInput = (e) => {
    e.preventDefault();
    setFormData({
      ...formData,
      tags: [...formData.tags, ""],
    });
  };

  const addFilterTagInput = (e) => {
    e.preventDefault();
    setFilterFormData({
      ...filterFormData,
      filterTags: [...filterFormData.filterTags, ""],
    });
  };

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    // Create the new object
    const newRank = Math.ceil(shelfObjects.length / 2);
    const newObject = {
      rank: newRank !== 0 ? newRank : 1,
      name: formData.name,
      tags: formData.tags.filter((tag) => tag !== "" && tag),
    };
    // Reset the form data
    setFormData({
      name: "",
      tags: [],
    });
    // Shift the ranks of the objects in the second half of the list down by one
    const updatedShelfObjects = shelfObjects.filter((obj) => {
      if (obj.data.rank >= newRank) {
        return obj;
      }
    });
    const batch = writeBatch(db);
    updatedShelfObjects.forEach((obj) => {
      const ref = doc(db, "shelfObjects", obj.id);
      batch.set(ref, { rank: obj.data.rank + 1 }, { merge: true });
    });
    const ref = db.collection("shelfObjects").doc();
    batch.set(ref, newObject);
    await batch.commit();
  };

  const deleteObject = async (obj) => {
    if (prompt("type 'ok' to delete this item") === "ok") {
      if (prompt("type 'delete' to confirm this") === "delete") {
        const batch = writeBatch(db);
        batch.delete(doc(db, "shelfObjects", obj.id));
        shelfObjects.forEach((inObj) => {
          if (inObj.data.rank > obj.data.rank) {
            batch.set(
              doc(db, "shelfObjects", inObj.id),
              {
                rank: inObj.data.rank - 1,
              },
              { merge: true }
            );
          }
        });
        await batch.commit();
      }
    }
  };

  // Function to toggle a tag for a shelf object
  const toggleTag = async (obj) => {
    if (prompt("type 'ok' to tag toggle this item") === "ok") {
      // Prompt the user for a tag to toggle
      const inputTag = prompt("Enter a tag to toggle:");
      // Check if the shelf object already has the tag
      const hasTag = obj.data.tags.includes(inputTag);
      let updatedTags;
      if (hasTag) {
        // Remove the tag from the shelf object's tags array
        updatedTags = obj.data.tags.filter((tag) => tag !== inputTag && tag);
      } else {
        // Add the tag to the shelf object's tags array
        updatedTags = [...obj.data.tags, inputTag];
      }
      await setDoc(
        doc(db, "shelfObjects", obj.id),
        {
          tags: updatedTags,
        },
        { merge: true }
      );
    }
  };

  // Function to move a shelf object up one rank
  // const moveUp = async (obj) => {
  //   if (obj.data.rank > 1) {
  //     // Get the current shelf object and the one before it
  //     const previousShelfObject = shelfObjects.filter(inObj => inObj.data.rank === obj.data.rank-1 && inObj)[0];
  //     const batch = writeBatch(db);
  //     const ref = doc(db, "shelfObjects", obj.id);
  //     batch.set(ref, { rank: obj.data.rank - 1 }, { merge: true });
  //     batch.set(
  //       doc(db, "shelfObjects", previousShelfObject.id),
  //       { rank: obj.data.rank },
  //       { merge: true }
  //     );
  //     await batch.commit();
  //   }
  // };

  // need to rework the above function moveUp into something that swaps the ranks of objects so it works with a list that has jumping ranks
  const moveUp = async (obj) => {
    // need to find a way to find the edge case and make sure its not the top element of the filtered results
    const filteredObjs = shelfObjects.filter(filterResult).sort((a, b) => {
      return a.data.rank > b.data.rank ? 1 : -1;
    });
    // const filteredObjs = shelfObjects.filter(obj => filterResults(obj))
    if (obj.id !== filteredObjs[0].id) {
      // going to grab
      const arr = filteredObjs.filter(
        (inObj) => inObj.data.rank < obj.data.rank && inObj
      )
      const shelfObjectGoingDown = arr[arr.length-1]
      const batch = writeBatch(db);
      const upRef = doc(db, "shelfObjects", obj.id);
      batch.set(
        upRef,
        { rank: shelfObjectGoingDown.data.rank },
        { merge: true }
      );
      const downRef = doc(db, "shelfObjects", shelfObjectGoingDown.id);
      batch.set(downRef, { rank: obj.data.rank }, { merge: true });
      await batch.commit();
    }
  };

  const shiftIndex = (num) => {
    setMatchupIndex(matchupIndex - num);
  };

  const isFilterActive = () => {
    let checker = false;
    filterFormData.filterTags.forEach((tag) => {
      if (tag !== "") {
        checker = true;
      }
    });
    return checker;
  };

  return (
    <div className="App">
      <h1>Unlimited Shelf</h1>
      <p>
        Length: {shelfObjects.length}{" "}
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={showMatchup || showFilterForm}
        >
          add
        </button>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setShowList(!showList);
            setShowMatchup(!showMatchup);
            randomizeMatchupIndex();
          }}
        >
          {showMatchup ? "list view" : "detailed sort"}
        </button>
        <button onClick={() => randomizeMatchupIndex()}>⥁</button>
        <button
          onClick={() => {
            setShowFilterForm(!showFilterForm);
          }}
          disabled={showMatchup || showForm}
          className={isFilterActive() ? "active-filter" : ""}
        >
          filter
        </button>
      </p>
      {showForm && !showMatchup && (
        <form>
          <label>name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <label>
            Tags:
            {formData.tags.map((tag, index) => (
              <div key={index}>
                <input
                  type="text"
                  value={tag}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      tags: formData.tags.map((tag, i) =>
                        i === index ? event.target.value : tag
                      ),
                    })
                  }
                />
              </div>
            ))}
            <button onClick={(e) => addTagInput(e)}>+</button>
          </label>
          <button onClick={handleSubmit} disabled={!formData.name}>
            create
          </button>
        </form>
      )}
      {showFilterForm && !showMatchup && (
        <form>
          <label>
            Filter Tags:
            {filterFormData.filterTags.map((tag, index) => (
              <div key={index}>
                <input
                  type="text"
                  value={tag}
                  onChange={(event) =>
                    setFilterFormData({
                      ...filterFormData,
                      filterTags: filterFormData.filterTags.map((tag, i) =>
                        i === index ? event.target.value : tag
                      ),
                    })
                  }
                />
              </div>
            ))}
            <button onClick={(e) => addFilterTagInput(e)}>+</button>
          </label>
        </form>
      )}
      {showList && !showMatchup && (
        <ol>
          {shelfObjects.filter(filterResult)
            .sort((a, b) => {
              return a.data.rank > b.data.rank ? 1 : -1;
            })
            .map((obj, index) => {
              return (
                <li key={index}>
                  <p>Rank: {obj.data.rank}</p>
                  <p>
                    Name: <span className="bigger">{obj.data.name}</span>
                  </p>
                  {/* <p>Tags: {JSON.stringify(obj.data.tags)}</p> */}
                  <p>Tags: 
                    <div>
                      {obj.data.tags.map(tag => <button>{tag.length > 25 ? tag.slice(0, 22) + '...' : tag}</button>)}
                    </div>
                  </p>
                  <button onClick={() => deleteObject(obj)}>X</button>
                  <button onClick={() => toggleTag(obj)}>tag</button>
                  <button onClick={() => moveUp(obj, index)}>&uarr;</button>
                </li>
              );
            })}
        </ol>
      )}
      {showMatchup && (
        <div>
          {matchupIndex > 0 ? (
            <div>
              {shelfObjects.filter(filterResult)
                .sort((a, b) => {
                  return a.data.rank > b.data.rank ? 1 : -1;
                })
                .filter((obj, index) => {
                  if (index === matchupIndex) {
                    return obj;
                  } else if (index === matchupIndex - 1) {
                    return obj;
                  }
                })
                .map((obj, index, array) => {
                  return (
                    <div key={index}>
                      {index > 0 ? (
                        <div>
                          <TagTieCard
                            tiedObjs={[array[index], array[index - 1]]}
                          />
                          <MatchupCard
                            obj={obj}
                            deleteObject={deleteObject}
                            toggleTag={toggleTag}
                            moveUp={moveUp}
                            shiftIndex={shiftIndex}
                            shiftNum={1}
                          />
                        </div>
                      ) : (
                        <MatchupCard
                          obj={obj}
                          deleteObject={deleteObject}
                          toggleTag={toggleTag}
                          moveUp={moveUp}
                          shiftIndex={shiftIndex}
                          shiftNum={2}
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            "You reached the top :)"
          )}
        </div>
      )}
    </div>
  );
}

export default App;

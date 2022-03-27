import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as firebaseHelper from "firebase-functions-helper";
import * as express from "express";
import * as bodyParser from "body-parser";

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
const app = express();
const main = express();
const notesCollection = "notes";
const countersCollection = "counters";

// add new note
app.post("/note", async (req, res) => {
  try {
    const note = {
      createdAt: req.body["created_at"],
      updatedAt: req.body["updated_at"],
      note: req.body["note"],
      username: req.body["username"],
    };

    const newDoc = await firebaseHelper.firestoreHelper.createNewDocument(
        db,
        notesCollection,
        note
    );

    // get last value of counter
    const counter = await firebaseHelper.firestoreHelper.getDocument(
        db,
        countersCollection,
        "notes"
    );
    // update counter collection
    await firebaseHelper.firestoreHelper.updateDocument(
        db,
        countersCollection,
        "notes",
        counter.total + 1
    );

    res.status(200).json({
      status: "ok",
      result: newDoc.id,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      result: error,
    });
  }
});

// update note
app.patch("/note/:id", async (req, res) => {
  try {
    await firebaseHelper.firestoreHelper.updateDocument(
        db,
        notesCollection,
        req.params.id,
        req.body
    );

    res.status(200).json({
      status: "ok",
      result: "updated",
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      result: error,
    });
  }
});

// view someone notes with pagination
app.get("/notes/:username/:page", (req, res) => {
  const queryArray = [["username", "==", req.params.username]];
  const orderBy = ["updated_at", "desc"];
  const size = 1000;
  const page = parseInt(req.params.page);

  firebaseHelper.firestoreHelper
      .queryDataWithPagiation(
          db,
          notesCollection,
          queryArray,
          orderBy,
          page,
          size
      )
      .then((doc) =>
        res.status(200).json({
          status: "ok",
          result: doc,
        })
      )
      .catch((error) =>
        res.status(400).json({
          status: "fail",
          result: error,
        })
      );
});

// view all counters with pagination
app.get("/counters/:page", (req, res) => {
  const queryArray: Array<string>[] = [];
  const orderBy = ["updated_at", "desc"];
  const size = 365000;
  const page = parseInt(req.params.page);

  firebaseHelper.firestoreHelper
      .queryDataWithPagiation(
          db,
          countersCollection,
          queryArray,
          orderBy,
          page,
          size
      )
      .then((doc) =>
        res.status(200).json({
          status: "ok",
          result: doc,
        })
      )
      .catch((error) =>
        res.status(400).json({
          status: "fail",
          result: error,
        })
      );
});

main.use("/v1", app);
main.use(bodyParser.json());
main.use(bodyParser.urlencoded({extended: false}));

export const api = functions.https.onRequest(main);

const express = require("express");
const router = express.Router();
const TeamModel = require("../../models/Teams");
const UserModel = require("../../models/User");
const fileUpload = require("../../config/cloudinary");

router.get("/", function (req, res, next) {
  TeamModel.find()
    .then((listofTeams) => {
      // console.log(`retrived all the teams !`);
      res.status(200).json(listofTeams);
    })
    .catch((err) => res.sendStatus(500));
});

router.post("/", fileUpload.single("image"), (req, res, next) => {
  const members = req.body.members.map(m => m._id);
  var newTeam = {
    ...req.body,
    owner: req.session.currentUser._id,
    members: [req.session.currentUser._id, ...members],
  };
  

  delete newTeam.image;

  if (req.file) {
    newTeam.image = req.file.path;
  }

  TeamModel.create(newTeam).then((dbRes) => {
    // console.log(`new team created !`);
    // newTeam.members.forEach((member) => {
    //   console.log("here's one member of the team", newTeam.name, " - ", member);
    UserModel.updateMany(
      { _id: { $in: newTeam.members } },
      { $push: { teams: dbRes._id } },
      { new: true }
    )
      .then((DBres) => console.log("team entry created in member"))
      .catch((err) => console.error(err));
    res.status(201).json(dbRes);
  });
});

router.get("/:id", function (req, res, next) {
  TeamModel.findById(req.params.id)
    .populate("owner")
    .populate("members")
    .populate("teamQuizz")
    .then((TeamJSON) => {
      // console.log(`retrived the team with unique ID ! : ${TeamJSON.data}`);
      res.status(200).json(TeamJSON);
    })
    .catch((err) => res.sendStatus(500));
});




router.patch("/:id/quizzes", function (req, res, next) {

  TeamModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
  .then(updTeam => TeamModel.populate(updTeam, {path:'teamQuizz', model: 'Quizz' }))
    .then((TeamJSON) => {
      // console.log(
      //   `updated team quizzes ! here's the update : ${TeamJSON}`
      // );
      res.status(202).json(TeamJSON);
    })
    .catch((err)=> console.error('error while populating', err))

  .catch((err) => res.sendStatus(500));
});


router.patch("/:id", fileUpload.single("image"), function (req, res, next) {
  var updTeam = {
    members: [req.session.currentUser._id, ...req.body.members],
    ...req.body,
  };

  delete updTeam.image;

  if (req.file) {
    updTeam.image = req.file.path;
  }
  TeamModel.findByIdAndUpdate(req.params.id, updTeam, { new: true })
    .then((TeamJSON) => {
      // console.log(
      //   `updated the team with unique ID ! here's the update : ${TeamJSON.data}`
      // );
      res.status(202).json(TeamJSON);
    })
    .catch((err) => res.sendStatus(500));
});

router.delete("/:id", function (req, res, next) {
  TeamModel.findByIdAndDelete(req.params.id)
    .then(() => {
      // console.log(`team deleted :(`);
      UserModel.updateMany(
        { teams:  req.params.id },
        { $pull: { teams: req.params.id } },
        { new: true }
      )
        .then((DBres) => {
          // console.log("team deleted in member");
          res.sendStatus(202);
        })
        .catch((err) => console.error(err));
    })
    .catch((err) => res.sendStatus(500));
});

//{"teams" : ObjectId('5f27e37db0b013e9c9bb275c')}

module.exports = router;

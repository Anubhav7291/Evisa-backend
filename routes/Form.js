import express from "express";
const router = express.Router()

router.route("/addStep1").get((req, res) => {
    res.status(200).json({message:"Submitted successfully"})
})

module.exports = router;
export default Form
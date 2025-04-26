const Review = require("../models/review.js");
const { listingSchema } = require('../schema.js');

const Listing = require("../models/listing.js");

module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    console.log("new response");
    req.flash("success", "Review added");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyReview = async (req, res) => {
    const { id, reviewId } = req.params;

    // Remove review reference from listing
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    // Delete the actual review
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted");

    res.redirect(`/listings/${id}`);
}
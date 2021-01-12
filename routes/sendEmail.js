const express = require("express"); 
const router = express.Router();
//const nodemailer = require("nodemailer");

const Order = require("../models/order");
const Vendor = require("../models/vendor");
const middlewareObj = require('../middleware');
const Customer = require("../models/customer");

router.get("/notification", middlewareObj.isLoggedIn, async (req, res) => {
    if(req.session.strategy === "customerLocal"){
        Order.find({customer: req.session.currentUser._id}).populate("store").sort({createdAt: -1}).exec((err, customerOrders) => {
            if(err){
                console.log(err);
            }
            else{
                res.render("notification", {orders: customerOrders});
            }
        })
    }
    
    else if(req.session.strategy === "vendorLocal"){
        var vendor = await Vendor.findById(req.session.currentUser._id);
        var vendorStore = vendor.store;
        Order.find({store: vendorStore}).populate("customer").sort({createdAt: -1}).exec((err, vendorOrders) =>{
            if(err){
                console.log(err);
            }
            else{
                res.render("notification", {orders: vendorOrders});
            }
        })
    }
    else{
        req.flash("error", "There is something wrong!");
        req.redirect("/");
    }
})

router.post("/notification/:order_id/cancel", (req, res) => {
    Order.findByIdAndUpdate(
        req.params.order_id, 
        {isCancelled: true},
        (err, updatedOrder) => {
            req.flash("success", "Order cancelled");
            res.redirect("/notification");
        }
    )
})

router.post("/notification/:order_id/accept", (req, res) => {
    Order.findByIdAndUpdate(
        req.params.order_id, 
        {isConfirmed: true},
        (err, updatedOrder) => {
            req.flash("success", "Order accepted");
            res.redirect("/notification");
        }
    )
})

router.post("/sendMail/:order_id/accept", (req, res) => {
    Order.findByIdAndUpdate(
        req.params.order_id,
        (err, updatedOrder) => {

            let transport = nodemailer.createTransport({
                host: "smtp.mailtrap.io",
                port: 2525,
                auth: {
                    user: "d9e3ab19b9f86b",
                    pass: "83df459bc96cde"
                }
            });

            const message = {
                from: "yimincheah@hotmail.com",
                to: Customer.email,
                subject: "Order Confirmation",
                text: "Your order have been confirmed by seller"
            };

            transport.sendMail(message, function (err, info) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(info);
                }

            });
            req.flash("success", "Email sent");
            res.redirect("/notification");
        }
    )
})





module.exports = router;

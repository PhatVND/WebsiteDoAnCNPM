import axios from "axios";
import React, { useState } from "react";
import { FaCreditCard, FaMoneyBills } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../css/Payment.css";

const Payment = () => {
    const { userId } = useAuth();
    const navigate = useNavigate();
    const handleNavigation = (path) => {
        navigate(path);
    };

    const location = useLocation();
    const { cartItems, finalTotalCost } = location.state || { cartItems: [], finalTotalCost: 0 };

    // Calculate total cost before applying discounts
    const totalCost = cartItems
        .filter((item) => item.buyNow)
        .reduce((total, item) => total + item.price * item.quantity, 0);

    // Payment Method
    const [paymentMethod, setPaymentMethod] = useState("");
    const handlePaymentChange = (event) => {
        setPaymentMethod(event.target.value);
    };

    const handleOrder = async (paymentMethod) => {
        try {
            const response = await axios.post(
                'http://localhost:8000/payment',
                {
                    user_id: userId,
                    paymentMethod: paymentMethod,
                    totalAmount: finalTotalCost,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (response.status === 200) {
                alert(`Order successfully!`);
                navigate("/");
            }
            if (response.status === 201) {
                alert(`You don't have enough funds. Please top up.`);
            }
        } catch (error) {
            console.error("Error ordering:", error);
        }
    };

    return (
        <div className="">
            <h2 style={{ textAlign: "center" }}>Your Invoice</h2>

            <div className="mt-4" style={{ margin: "90px", display: "block" }}>
                {cartItems.length > 0 ? (
                    <div className="invoice mt-3">
                        {cartItems.filter((item) => item.buyNow).map((item) => (
                            <div
                                key={item.id}
                                className="invoice-item d-flex justify-content-between"
                            >
                                <span>
                                    {item.name} x {item.quantity}
                                </span>
                                <span>{item.price * item.quantity} VNĐ</span>
                            </div>
                        ))}
                        <div className="invoice-item d-flex justify-content-between">
                            <span>Discount from voucher </span>
                            <span>
                                - {totalCost - finalTotalCost} VNĐ
                            </span>
                        </div>
                        <div className="invoice-total d-flex justify-content-between">
                            <strong>Total:</strong>
                            <strong>{finalTotalCost} VNĐ</strong>
                        </div>
                        <div className="invoice-radio d-flex flex-column mt-3">
                            <p>Choose Payment Method:</p>
                            <div className="form-check">
                                <input
                                    type="radio"
                                    className="form-check-input"
                                    id="onlinePayment"
                                    name="paymentMethod"
                                    value="online"
                                    checked={paymentMethod === "online"}
                                    onChange={handlePaymentChange}
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor="onlinePayment"
                                >
                                    <FaCreditCard style={{ marginRight: "10px" }} /> Online Payment
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    type="radio"
                                    className="form-check-input"
                                    id="cashPayment"
                                    name="paymentMethod"
                                    value="cash"
                                    checked={paymentMethod === "cash"}
                                    onChange={handlePaymentChange}
                                />
                                <label className="form-check-label" htmlFor="cashPayment">
                                    <FaMoneyBills style={{ marginRight: "10px" }} /> Cash Payment
                                </label>
                            </div>
                        </div>
                        <div className="invoice-actions d-flex justify-content-between mt-3">
                            <button
                                className="btn red-btn"
                                onClick={() => handleNavigation("/cart")}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn blue-btn"
                                onClick={() => handleOrder(paymentMethod)}
                            >
                                Order
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="center-container text-center text-muted">
                        No items selected for purchase
                    </p>
                )}
            </div>
        </div>
    );
};

export default Payment;

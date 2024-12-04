import axios from "axios";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Notification from "../Notification";
import "../css/Menu.css";

const Menu = () => {
  const { userId } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodList, setFoodList] = useState([]);
  const [expandedReviewIndex, setExpandedReviewIndex] = useState(null); // Track the expanded comment section
  const [commentText, setCommentText] = useState("");
  const [sortOrder, setSortOrder] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [editingComment, setEditingComment] = useState(null); // Lưu thông tin comment đang chỉnh sửa
  const [editedCommentText, setEditedCommentText] = useState(""); // Lưu nội dung chỉnh sửa
  const [notification, setNotification] = useState(null);
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchFoodList = async () => {
    try {
      const response = await axios.get("http://localhost:8000/menu/all");
      setFoodList(response.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  useEffect(() => {
    fetchFoodList();
  }, []);

  // useEffect sẽ gọi lại hàm fetchFoodList mỗi khi foodList thay đổi
  useEffect(() => {
    fetchFoodList();
  }, [foodList]);

  const getUserInfo = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:8000/user/${userId}`, {
        headers: { "Content-Type": "application/json" }
      });
      return response.data; // Trả về dữ liệu user
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null; // Xử lý lỗi bằng cách trả về null
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      const data = await getUserInfo(userId);
      if (data) {
        setUserInfo(data);
      } else {
        console.error("Failed to fetch user info.");
      }
    };
    if (userId) {
      fetchUserInfo();
    }
  }, [userId]);

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  const handleShowReviews = (food) => {
    setSelectedFood(food);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFood(null);
  };
  const updateFoodReviews = async (foodId, updatedReviews) => {
    try {
      // Tìm món ăn cần cập nhật
      const foodToUpdate = foodList.find((food) => food.id === foodId);
      if (!foodToUpdate) return;
      // Tạo object món ăn đã được cập nhật
      const updatedFood = { ...foodToUpdate, reviews: updatedReviews };
      // Gửi yêu cầu PUT với axios
      const response = await axios.put(`http://localhost:8000/menu/update/${foodId}`, updatedFood, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.status !== 200) {
        throw new Error("Failed to update reviews");
      }
      // Cập nhật danh sách món ăn
      fetchFoodList();
    } catch (error) {
      console.error("Error updating food reviews:", error);
    }
  };

  const handleLikeReview = async (foodId, reviewIndex) => {
    const updatedFood = { ...selectedFood };
    const review = updatedFood.reviews[reviewIndex];

    // Đảm bảo `mylike` được khởi tạo là một mảng
    review.mylike = review.mylike || [];

    if (review.mylike.includes(userId)) {
      // Nếu đã thích, gỡ like
      review.mylike = review.mylike.filter((id) => id !== userId);
      review.likes -= 1;
    } else {
      // Nếu chưa thích, thêm `userId` vào mảng `mylike`
      review.mylike.push(userId);
      review.likes += 1;
    }

    try {
      // Cập nhật dữ liệu bằng axios
      const response = await axios.put(
        `http://localhost:8000/menu/update/${selectedFood.id}`,
        updatedFood, // Truyền dữ liệu đã cập nhật
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        // Cập nhật giao diện sau khi update thành công
        setSelectedFood(updatedFood);
        const updatedFoodList = foodList.map((food) =>
          food.id === foodId ? updatedFood : food
        );
        setFoodList(updatedFoodList);
        //setFilteredFoodList(updatedFoodList);
      } else {
        alert(response.data.message || "Failed to update review.");
      }
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review.");
    }
  };

  const applyFilters = () => {
    let filteredList = [...foodList];

    // Apply category filter
    if (filterCategory) {
      filteredList = filteredList.filter((food) => food.category === filterCategory);
    }

    // Apply search filter
    if (searchText.trim()) {
      filteredList = filteredList.filter((food) =>
        food.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply sort
    if (sortOrder === "asc") {
      filteredList.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "desc") {
      filteredList.sort((a, b) => b.price - a.price);
    }

    return filteredList;
  };

  const displayedFoodList = applyFilters();

  const handleAddComment = (index) => {
    setExpandedReviewIndex(index === expandedReviewIndex ? null : index);
  };

  const handleSendComment = async (reviewIndex) => {
    if (!commentText.trim()) return;

    const updatedFood = { ...selectedFood };
    const newComment = {
      username: userInfo?.username || "Unknown User", // Dùng thông tin từ userInfo
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      comment: commentText,
      comment_id: userId,
      role: "staff",
    };
    updatedFood.reviews[reviewIndex].comments.push(newComment);

    try {
      const response = await axios.put(
        `http://localhost:8000/menu/update/${updatedFood.id}`,
        updatedFood,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        updatedFood.reviews = response.data.dish.reviews;
        setSelectedFood(updatedFood); // Cập nhật dữ liệu trên giao diện
        setCommentText(""); // Reset ô nhập
      } else {
        alert(response.data.message || "Failed to send comment.");
      }
    } catch (error) {
      console.error("Error sending comment:", error);
      alert("Failed to send comment.");
    }
  };

  const handleDeleteComment = async (foodId, reviewId, commentId) => {
    try {
      // Gọi API trước khi cập nhật state để đảm bảo dữ liệu nhất quán
      const response = await axios.delete(
        `http://localhost:8000/foods/${foodId}/reviews/${reviewId}/comments/${commentId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        // Chỉ cập nhật state nếu API thành công
        const updatedFood = { ...selectedFood };
        const review = updatedFood.reviews.find((r) => r._id === reviewId);

        if (review) {
          review.comments = review.comments.filter(
            (comment) => comment._id !== commentId
          );
        }

        setSelectedFood(updatedFood); // Cập nhật state sau khi xóa thành công
        showNotification(`Comment has been successfully deleted!`);
      } else {
        alert(response.data.message || "Failed to delete comment.");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment.");
    }
  };

  const handleUpdateComment = async (foodId, reviewId, commentId, newComment) => {
    try {
      // Hiển thị thông báo "Đang cập nhật..." nếu cần
      console.log("Updating comment...");

      // Gửi yêu cầu cập nhật bình luận
      const response = await axios.put(
        `http://localhost:8000/foods/${foodId}/reviews/${reviewId}/comments/${commentId}`,
        { newComment }, // Gửi nội dung bình luận mới
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log("Comment updated successfully");

        // Lấy bình luận đã cập nhật từ API
        const updatedComment = response.data.comment;

        // Cập nhật state `selectedFood` với bình luận đã chỉnh sửa
        const updatedFood = { ...selectedFood };
        const review = updatedFood.reviews.find((r) => r._id === reviewId);

        if (review) {
          review.comments = review.comments.map((comment) =>
            comment._id === commentId ? updatedComment : comment
          );
        }

        // Lưu state mới
        setSelectedFood(updatedFood);
        setEditingComment(null); // Thoát chế độ chỉnh sửa
      } else {
        alert(response.data.message || "Failed to update comment.");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      alert(
        error.response?.data?.message || "An error occurred while updating the comment."
      );
    }
  };

  const handleSort = (order) => {
    if (order === "asc" || order === "desc") setSortOrder(order);
    else setSortOrder("");
  };

  const handleCategoryFilter = (category) => {
    setFilterCategory(category); // Cập nhật danh mục được chọn
  };

  const handleStatusChange = async (foodId) => {
    try {
      const updatedFood = foodList.find((food) => food.id === foodId);
      if (!updatedFood) return;

      // Cập nhật trạng thái `inStock` tại chỗ
      const updatedStatus = { ...updatedFood, inStock: !updatedFood.inStock };

      // Gửi yêu cầu PUT tới API để lưu thay đổi vào database
      const response = await axios.put(
        `http://localhost:8000/menu/update/${foodId}`,
        updatedStatus, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.status === 200) {
        // Cập nhật giao diện sau khi thành công
        setFoodList((prevList) =>
          prevList.map((food) =>
            food.id === foodId ? { ...food, inStock: updatedStatus.inStock } : food
          )
        );
      } else {
        alert(response.data.message || "Failed to update food status.");
      }
    } catch (error) {
      console.error("Error updating food status:", error);
      alert("Failed to update food status. Please try again.");
    }
  };

  return (
    <div className="">
      <h2 style={{ textAlign: 'center' }}>Today Menu</h2>

      {/* Search, Filter, and Sort */}
      <div className="search-filter-sort">
        {/* Filter */}
        <div className="dropdown">
          <button type="button" className="icon-btn">
            <i className="fas fa-filter"></i>
          </button>
          <div className="dropdown-content">
            <button onClick={() => handleCategoryFilter("food")}>Filter by Food</button>
            <button onClick={() => handleCategoryFilter("drink")}>Filter by Drink</button>
            <button onClick={() => handleCategoryFilter("snack")}>Filter by Snack</button>
            <button onClick={() => handleCategoryFilter("")}>Clear Category Filter</button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            className="form-control"
            placeholder="Search for food..."
            onChange={handleSearch}
            value={searchText}
          />
          <button type="button" className="btn search-btn">
            <i className="fas fa-search"></i>
          </button>
        </div>

        {/* Sort */}
        <div className="dropdown">
          <button type="button" className="icon-btn">
            <i className="fas fa-sort"></i>
          </button>
          <div className="dropdown-content">
            <button onClick={() => handleSort("")}>Clear Filters</button>
            <button onClick={() => handleSort('asc')}>Sort by Price (Low to High)</button>
            <button onClick={() => handleSort('desc')}>Sort by Price (High to Low)</button>
          </div>
        </div>
      </div>

      {/* Food Cards */}
      <div className="container mt-4">
        <div className="row">
          {displayedFoodList.map((food) => (
            <div key={food.id} className="col-12 col-sm-6 col-md-4">
              <div className="card">
                <img
                  src={food.image}
                  className={`card-img-top food-img ${!food.inStock ? "grayscale" : ""}`}
                  alt={food.name}
                />
                <div className="card-body">
                  <div className="card-title">{food.name}</div>
                  <div className="card-price">{food.price} VNĐ</div>
                  <p className="card-text">{food.description}</p>
                  <button
                    className={`btn ${food.inStock ? "blue-btn" : "red-btn"}`}
                    onClick={() => handleStatusChange(food.id)}
                  >
                    {food.inStock ? "In Stock" : "Out of Stock"}
                  </button>
                  <button className="btn blue-btn" onClick={() => handleShowReviews(food)}>
                    Reviews
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Reviews */}
      {showModal && (
        <div className="modal-review-overlay">
          <div className="modal-review-content">
            <div className="modal-review-header">
              <h3>Reviews for {selectedFood?.name}</h3>
              <button className="red-btn" onClick={handleCloseModal} style={{ position: 'absolute', top: '10px', right: '10px', padding: '0px 10px', fontSize: '20px' }}>&times;</button>
            </div>
            <div className="review-list">
              {selectedFood?.reviews && selectedFood.reviews.length > 0 ? (
                selectedFood.reviews.map((review, index) => (
                  <div key={index} className="review-item row">
                    <div className="user-avatar col-2">
                      <img src={review.avatar || "../image/avatar.jpg"} alt="User Avatar" />
                      <p className="user-name">{review.username}</p>
                      <p className="review-timestamp">{review.timestamp}</p>
                    </div>
                    <div className="col-10 rating-section" style={{ textAlign: 'left' }}>
                      <span className="me-2">Rating:</span>
                      {[...Array(5)].map((_, idx) => (
                        <i
                          key={idx}
                          className={`fas fa-star ${idx < review.rating ? "selected" : ""}`}
                          style={{ margin: '0 5px' }}
                        ></i>
                      ))}
                      <div className="review-content">
                        <p>{review.review}</p>
                      </div>
                      <div className="review-actions">
                        <button className="cmt-btn"
                          style={{
                            color: review.mylike.includes(userId) ? "white" : "initial",
                            backgroundColor: review.mylike.includes(userId) ? "black" : "initial"
                          }}
                          onClick={() => handleLikeReview(selectedFood.id, index)}>
                          <i className="fas fa-thumbs-up"> Like</i> {review.likes}
                        </button>
                        <button className="cmt-btn"
                          style={{ color: expandedReviewIndex === index ? "white" : "initial", backgroundColor: expandedReviewIndex === index ? "black" : "initial" }}
                          onClick={() => handleAddComment(index)}>
                          <i className="fas fa-comment"> Comment</i>
                        </button>
                      </div>
                      {/* Comments section */}
                      {expandedReviewIndex === index && (
                        <div className="comments-section">
                          {review.comments?.map((comment, cIndex) => (
                            <div className="row" key={cIndex}>
                              <div className="col-3">
                                <span style={{ color: comment.role === 'staff' ? 'red' : 'inherit' }}><strong>{comment.username}</strong></span>
                                <p>{comment.timestamp}</p>
                              </div>
                              {/* Edit comment */}
                              {editingComment === comment._id ? (
                                <div className="col-9" style={{ margin: 0, padding: 0 }}>
                                  <textarea
                                    className=""
                                    value={editedCommentText}
                                    onChange={(e) => setEditedCommentText(e.target.value)}
                                    style={{ width: '100%' }}
                                  />
                                  <div className="row">
                                    <button
                                      className="col-2 me-2 btn blue-btn"
                                      style={{ margin: '0 5px 5px 0' }}
                                      onClick={() => handleUpdateComment(selectedFood._id, review._id, comment._id, editedCommentText)}>
                                      Save
                                    </button>
                                    <button
                                      className="col-2 btn red-btn"
                                      style={{ margin: '0 5px 5px 0' }}
                                      onClick={() => setEditingComment(null)}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="col-9">
                                  <p className="mb-0 text-break flex-grow-1" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                                    {comment.comment}
                                  </p>
                                  {/* Nút "Edit" và "Delete" chỉ hiển thị khi user chính là người comment */}
                                  {comment.comment_id === userId && (
                                    <div className="row">
                                      <button
                                        className="col-2 me-2 btn blue-btn"
                                        onClick={() => {
                                          setEditingComment(comment._id); // Ghi nhận ID của comment đang chỉnh sửa
                                          setEditedCommentText(comment.comment); // Đặt giá trị ban đầu vào editedCommentText
                                        }}>
                                        Edit
                                      </button>
                                      <button
                                        className="col-2 me-2 btn red-btn"
                                        onClick={() => { handleDeleteComment(selectedFood._id, review._id, comment._id) }}>
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="col-12 d-flex align-items-center">
                            <input
                              type="text"
                              className="form-control"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Write a comment..."
                            />
                            <button className="blue-btn" style={{ color: 'white', backgroundColor: 'black', marginLeft: '10px' }} onClick={() => {
                              handleSendComment(index)
                            }}>Send</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p>No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination (Optional) */}
      <nav aria-label="Page navigation">
        <ul className="pagination justify-content-center">
          <li className="page-item">
            <button className="page-link">&laquo; Prev</button>
          </li>
          <li className="page-item">
            <button className="page-link">1</button>
          </li>
          <li className="page-item">
            <button className="page-link">2</button>
          </li>
          <li className="page-item">
            <button className="page-link">3</button>
          </li>
          <li className="page-item">
            <button className="page-link">Next &raquo;</button>
          </li>
        </ul>
      </nav>
      {/* Notification */}
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default Menu;
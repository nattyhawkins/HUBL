import axios from 'axios'
import { useState, useEffect } from 'react'
import { Button, Card, Collapse } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { getToken, isOwner } from '../../helpers/auth'
import { getTimeElapsed } from '../../helpers/general'
import PostForm from '../common/PostForm'
import CommentForm from './CommentForm'
import Profile from './Profile'



const Post = ({ postId, post, commentHTML, tagsHTML, groupId, setRefresh, refresh }) => {

  const [open, setOpen] = useState(false)
  const [likeStatus, setLikeStatus] = useState(() => {
    if (getToken() && post.likes.some(like => isOwner(like.owner))) return 202
    return 204
  })
  const [timeElapsed, setTimeElapsed] = useState(getTimeElapsed(post.createdAt))
  const [toEdit, setToEdit] = useState(false)
  const [error, setError] = useState(false)
  const [postFields, setPostFields] = useState({
    title: '',
    message: '',
    tags: [],
  })
  const [commentField, setCommentField] = useState({
    message: '',
  })

  //time since posting
  useEffect(() => {
    const tick = setInterval(() => {
      setTimeElapsed(getTimeElapsed(post.createdAt))
    }, 1000)
    return () => {
      clearInterval(tick)
    }
  }, [])

  async function handleCommentSubmit(e) {
    try {
      e.preventDefault()
      if (!getToken()) throw new Error('Please login')
      await axios.post(`/api/groups/${groupId}/posts/${postId}/comments`, commentField, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
      console.log('post comment success')
      setRefresh(!refresh)
      setCommentField({ message: '' })
      setOpen(true)
    } catch (err) {
      console.log(err.message ? err.message : err.response.data.message)
      setError(err.message ? err.message : err.response.data.message)
    }
  }

  //Updating Post
  async function editPost(e) {
    setToEdit(!toEdit)
    setPostFields({
      title: post.title,
      message: post.message,
      tags: post.tags,
    })
  }
  //submit edit post
  async function handlePostSubmit(e) {
    try {
      e.preventDefault()
      await axios.put(`/api/groups/${groupId}/posts/${postId}`, postFields, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
      console.log('Edit post success')
      setRefresh(!refresh)
      setToEdit(false)
      setPostFields({ title: '', message: '', tags: [] })
    } catch (err) {
      console.log(err.response.data.message)
      setError(err.response.data.message)
    }
  }
  //delete post
  async function deletePost(e) {
    try {
      e.preventDefault()
      await axios.delete(`/api/groups/${groupId}/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
      console.log('delete post success')
      setRefresh(!refresh)
      setPostFields({ title: '', message: '', tags: [] })
    } catch (err) {
      console.log(err.response.data.message)
      setError(err.response.data.message)
    }
  }

  async function handlePostLike(e) {
    try {
      if (!getToken()) throw new Error('Please login')
      e.preventDefault()
      const { status } = await axios.post(`/api/groups/${groupId}/posts/${postId}/likes`, {}, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
      setLikeStatus(status)
      console.log('like success')
      setRefresh(!refresh)
    } catch (err) {
      console.log(err.message ? err.message : err.response.data.message)
      setError(err.message ? err.message : err.response.data.message)
    }
  }


  return (
    <Card key={postId} className='post'>
      <Card.Body className='pt-2 pb-0'>
        {/* If owner show edit & delete */}
        <div className='d-flex justify-content-between mb-3'>
          <div className='d-flex align-items-center justify-content-end'>
            <Link to={`/profile/${post.owner._id}`} className="d-flex flex-column align-items-center">
              <Card.Title className="username mb-0" >@{post.owner.username}</Card.Title>
            </Link>
            <small>{timeElapsed}</small>
          </div>
          <div className='d-flex justify-content-end' style={{ height: '20px' }}>
            {isOwner(post.owner._id) &&
              <>
                <p className='post-btn' onClick={editPost}>•••</p>
                <p style={{ fontSize: '15px' }} className='post-btn' onClick={deletePost}>🆇</p>
              </>
            }
          </div>
        </div>
        <div className='d-flex justify-content-between'>
          <Link to={`/profile/${post.owner._id}`} className="d-flex flex-column align-items-center">
            <div className="profile-pic icon" style={{ backgroundImage: `url(${post.owner.image})` }} alt="profile"></div>
          </Link>
          <div style={{ width: 'calc(100% - 110px)' }}>
            {toEdit ?
              <PostForm postFields={postFields} setPostFields={setPostFields} error={error} setError={setError} handlePostSubmit={handlePostSubmit} />
              :
              <div className="textBox">
                <Card.Title>{post.title} </Card.Title>
                <Card.Text>{post.message}</Card.Text>
              </div>
            }
          </div>
        </div>
        <div className='infoBox'>
          <div className='d-flex align-items-center' style={{ height: '50px' }}>
            {/* comment box */}
            <div className="d-flex align-items-center justify-content-end" style={{ width: '260px' }} onClick={() => setOpen(!open)} aria-controls={postId} aria-expanded={open}>
              <p className='like-btn' >💬</p>
              <div style={{ width: '220px' }}>
                <small>
                  {post.comments.length === 0 ? <> Be the first to comment</>
                    :
                    post.comments.length === 1 ? <> 1 Comment</>
                      :
                      <>{post.comments.length} Comments</>
                  }
                </small>
              </div>
            </div>
            {/* like box */}
            <div className="d-flex align-items-center justify-content-end" style={{ width: '230px' }} onClick={handlePostLike}>
              {likeStatus === 204 ?
                <p className='like-btn' >👍</p>
                :
                <p className='like-btn liked'>❤️</p>
              }
              <div style={{ width: '190px' }}>
                <small >
                  {post.likes.length === 0 ? <> Be the first to like</>
                    :
                    post.likes.length === 1 ? <> 1 Like</>
                      :
                      <>{post.likes.length} Likes</>
                  }
                </small>
              </div>
            </div>
          </div>
        </div>
        {/* <a id={postId} ></a> */}
        <Collapse in={open}>
          <div id={postId}>
            <CommentForm commentField={commentField} setCommentField={setCommentField} error={error} setError={setError} handleCommentSubmit={handleCommentSubmit} />
            {commentHTML}
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  )
}

export default Post
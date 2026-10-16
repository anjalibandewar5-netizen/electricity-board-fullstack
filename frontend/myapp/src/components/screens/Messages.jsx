import React, { Children } from 'react'
import { Alert } from 'react-bootstrap'

function Messages() {
  return (
    <Alert variant={variant}>{Children}</Alert>
  )
}

export default Messages

import React from 'react'
import { Checkbox } from '@mantine/core'

export const UserModelAccessControl = ({ users, models, updateUserModels }) => {
  const handleCheckboxChange = (userId, modelId, isChecked) => {
    updateUserModels(userId, modelId, isChecked)
  }

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <h2>{user.name}</h2>
          {models.map(model => (
            <Checkbox
              key={model.id}
              checked={user.models.includes(model.id)}
              label={model.name}
              onChange={isChecked => handleCheckboxChange(user.id, model.id, isChecked)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
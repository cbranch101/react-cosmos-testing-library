import createGenericContext from 'react-cosmos-test/generic'
import {render as baseRender} from '@testing-library/react'

const createTestContext = fixture => {
  const context = createGenericContext({
    fixture,
    renderer: baseRender,
  })
  return context
}

export default fixture => {
  const {mount, getWrapper} = createTestContext(fixture)
  mount()
  return getWrapper()
}

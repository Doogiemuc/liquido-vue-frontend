/**
 Start to finish HAPPY CASE for Liquido
 */

import api from '../../../src/services/LiquidoApiClient'


function rand(min,max)   // Intervall [min, max[
{
  return Math.floor(Math.random()*(max-min)+min);
}

describe('Liquido Happy Case Test', function() {

	before(function() {
		/** Import Test Fixtures */
		cy.fixture('liquidoTestFixtures.json').then(fix => {
		  this.fix = fix
		})
	})

  it('Go to search page', function() {
    cy.visit('/#/?devLoginMobilephone=%2B49123451')
    cy.get('#LiquidoHome').should('exist')
    cy.get('#SearchButton').click()
    cy.get('#SearchPage').should('exist')
    cy.get('#SearchTable').get('table tbody tr').should('have.length.of.at.least', 1)
  })
  
  it.only('Filter createdByYou', function() {
    cy.visit('/#/?devLoginMobilephone=%2B49123451')
    cy.get('#SearchButton').click()
    cy.get('#createdByYou').click()
    cy.get('#createdByEmail button').should('have.class', 'btn-primary')
    cy.get('#SearchTable').get('table tbody tr').should('have.length.of.at.least', 1)
    cy.get('#createdByYou').click()   // DE-activate "Created by you"
    cy.get('#createdByEmail button').should('have.class', 'btn-default')
    cy.get('#SearchTable > table > tbody > tr:nth-child(1) > td:nth-child(4) img').debug()
  })

  it('Filter by status', function() {
    cy.visit('/#/?devLoginMobilephone=%2B49123451')
    cy.get('#SearchButton').click()
    cy.get('#status').click()
    cy.get('.dropdown-menu > .selectList > :nth-child(1)').click()
    cy.get('.dropdown-menu > .selectList > :nth-child(2)').click()
    cy.get('.dropdown-menu > .btn-primary').click()
    cy.get('#SearchTable').get('table tbody tr').should('have.length.of.at.least', 1)
    cy.get('tbody > :nth-child(1) > td:nth-of-type(1)').should('contain', 'Proposal')
  })

})


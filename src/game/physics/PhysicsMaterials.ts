import * as CANNON from 'cannon-es';

export const MATERIALS = {
  player: new CANNON.Material('player'),
  ground: new CANNON.Material('ground')
};

export const CONTACT_MATERIALS = {
  playerGround: new CANNON.ContactMaterial(
    MATERIALS.player,
    MATERIALS.ground,
    {
      friction: 0.01,
      restitution: 0.0,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3
    }
  )
};
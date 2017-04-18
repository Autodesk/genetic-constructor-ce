import Vector2D from '../../src/containers/graphics/geometry/vector2d';
import Transform2D from '../../src/containers/graphics/geometry/transform2d';
import Matrix2D from '../../src/containers/graphics/geometry/matrix2d';
import {nearly} from '../../src/containers/graphics/utils';
import chai from 'chai';

describe('Transform2D', () => {

  it('should make an indentity transform', () => {
    const t = new Transform2D();
    chai.expect(t.scale.x).to.equal(1);
    chai.expect(t.scale.y).to.equal(1);
    chai.expect(t.translate.x).to.equal(0);
    chai.expect(t.translate.y).to.equal(0);
    chai.expect(t.rotate).to.equal(0);
    chai.expect(t.flip.x).to.equal(1);
    chai.expect(t.flip.y).to.equal(1);
  });

  it('should be able to set the S/R/T components', () => {
    const t = new Transform2D();

    t.scale = new Vector2D(5,6);
    t.rotate = 45;
    t.translate = new Vector2D(3,4);
    t.flip = new Vector2D(-1, -1);

    chai.expect(t.scale.x).to.equal(5);
    chai.expect(t.scale.y).to.equal(6);
    chai.expect(t.translate.x).to.equal(3);
    chai.expect(t.translate.y).to.equal(4);
    chai.expect(t.rotate).to.equal(45);
    chai.expect(t.flip.x).to.equal(-1);
    chai.expect(t.flip.y).to.equal(-1);
  });

  it('should be able to persist to and from an object', () => {
    const t = new Transform2D();

    t.scale = new Vector2D(5,6);
    t.rotate = 45;
    t.translate = new Vector2D(3,4);
    t.flip = new Vector2D(-1, -1);

    var t2 = Transform2D.fromObject(t.toObject());
    chai.expect(t2.scale.x).to.equal(5);
    chai.expect(t2.scale.y).to.equal(6);
    chai.expect(t2.translate.x).to.equal(3);
    chai.expect(t2.translate.y).to.equal(4);
    chai.expect(t2.rotate).to.equal(45);
    chai.expect(t2.flip.x).to.equal(-1);
    chai.expect(t2.flip.y).to.equal(-1);

  });

  it('should be able to generate a transformation matrix', () => {
    const t = new Transform2D();
    let m = t.getTransformationMatrix(0,0);
    chai.expect(m.isIdentity()).to.be.true;

    t.scale = new Vector2D(5,6);
    t.rotate = 45;
    t.translate = new Vector2D(3,4);
    t.flip = new Vector2D(1, -1);

    m = t.getTransformationMatrix(100,100);
    chai.expect(nearly(m._v[0], 3.5355339059327378)).to.be.true;
    chai.expect(nearly(m._v[1], 4.242640687119285)).to.be.true;
    chai.expect(nearly(m._v[2], -385.9087296526011)).to.be.true;
    chai.expect(nearly(m._v[3], 3.5355339059327373)).to.be.true;
    chai.expect(nearly(m._v[4], -4.242640687119286)).to.be.true;
    chai.expect(nearly(m._v[5], 39.355339059327434)).to.be.true;
    chai.expect(nearly(m._v[6], 0)).to.be.true;
    chai.expect(nearly(m._v[7], 0)).to.be.true;
    chai.expect(nearly(m._v[8], 1)).to.be.true;

  });

});

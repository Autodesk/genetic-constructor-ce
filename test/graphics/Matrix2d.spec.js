import Vector2D from '../../src/containers/graphics/geometry/vector2d';
import Transform2D from '../../src/containers/graphics/geometry/transform2d';
import Matrix2D from '../../src/containers/graphics/geometry/matrix2d';
import {nearly} from '../../src/containers/graphics/utils';
import chai from 'chai';

describe('Matrix2D', () => {

  it('should make an identity matrix', () => {
    const m = new Matrix2D();
    chai.expect(m.isIdentity()).to.be.true;
  });

  it('should make a matrix from 9 numbers', () => {
    const m = new Matrix2D([1,2,3,4,5,6,0,0,1]);
    chai.expect(m._v[0]).to.equal(1);
    chai.expect(m._v[1]).to.equal(2);
    chai.expect(m._v[2]).to.equal(3);
    chai.expect(m._v[3]).to.equal(4);
    chai.expect(m._v[4]).to.equal(5);
    chai.expect(m._v[5]).to.equal(6);
    chai.expect(m._v[6]).to.equal(0);
    chai.expect(m._v[7]).to.equal(0);
    chai.expect(m._v[8]).to.equal(1);
  });

  it('should be cloneable', () => {
    const m1 = new Matrix2D([1,2,3,4,5,6,0,0,1]);
    const m = m1.clone();
    chai.expect(m._v[0]).to.equal(1);
    chai.expect(m._v[1]).to.equal(2);
    chai.expect(m._v[2]).to.equal(3);
    chai.expect(m._v[3]).to.equal(4);
    chai.expect(m._v[4]).to.equal(5);
    chai.expect(m._v[5]).to.equal(6);
    chai.expect(m._v[6]).to.equal(0);
    chai.expect(m._v[7]).to.equal(0);
    chai.expect(m._v[8]).to.equal(1);
  });

  it('should be composable and multiplyable', () => {
    const s = Matrix2D.scale(3,4);
    const r = Matrix2D.rotate(90);
    const t = Matrix2D.translate(5,6);
    const m = s.multiplyMatrix(r).multiplyMatrix(t);

    chai.expect(nearly(m._v[0], 0)).to.be.true;
    chai.expect(nearly(m._v[1], -3)).to.be.true;
    chai.expect(nearly(m._v[2], -18)).to.be.true;
    chai.expect(nearly(m._v[3], 4)).to.be.true;
    chai.expect(nearly(m._v[4], 0)).to.be.true;
    chai.expect(nearly(m._v[5], 20)).to.be.true;
    chai.expect(nearly(m._v[6], 0)).to.be.true;
    chai.expect(nearly(m._v[7], 0)).to.be.true;
    chai.expect(nearly(m._v[8], 1)).to.be.true;

  });

  it('should be invertable', () => {
    const s = Matrix2D.scale(3,4);
    const r = Matrix2D.rotate(90);
    const t = Matrix2D.translate(5,6);
    let m = s.multiplyMatrix(r).multiplyMatrix(t);
    m = m.inverse();

    chai.expect(nearly(m._v[0], 0)).to.be.true;
    chai.expect(nearly(m._v[1], 0.25)).to.be.true;
    chai.expect(nearly(m._v[2], -5)).to.be.true;
    chai.expect(nearly(m._v[3], -0.333333333)).to.be.true;
    chai.expect(nearly(m._v[4], 0)).to.be.true;
    chai.expect(nearly(m._v[5], -6)).to.be.true;
    chai.expect(nearly(m._v[6], 0)).to.be.true;
    chai.expect(nearly(m._v[7], 0)).to.be.true;
    chai.expect(nearly(m._v[8], 1)).to.be.true;

  });

  it('should be able to multiply a vector', () => {
    const s = Matrix2D.scale(3,4);
    const r = Matrix2D.rotate(90);
    const t = Matrix2D.translate(5,6);
    let m = s.multiplyMatrix(r).multiplyMatrix(t);
    const v = m.multiplyVector(new Vector2D(3.14, 7));

    chai.expect(nearly(v.x, -39)).to.be.true;
    chai.expect(nearly(v.y, 32.56)).to.be.true;

  });

  it('should format to a CSS matrix', () => {
    const m = new Matrix2D();
    chai.expect(m.toCSSString()).to.equal('matrix(1.00000000, 0.00000000, 0.00000000, 1.00000000, 0.00000000, 0.00000000)');
  });

  it('should importable from a css matrix', () => {
    const m = new Matrix2D();
    m.importCSSValues({
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6
    });
    chai.expect(m.toCSSString()).to.equal('matrix(1.00000000, 2.00000000, 3.00000000, 4.00000000, 5.00000000, 6.00000000)');
  });


});

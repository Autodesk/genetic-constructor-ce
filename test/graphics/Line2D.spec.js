import Vector2D from '../../src/containers/graphics/geometry/vector2d';
import Line2D from '../../src/containers/graphics/geometry/line2d';
import {nearly} from '../../src/containers/graphics/utils';
import chai from 'chai';

describe('Line2D', () => {

  it('should make an zero length line', () => {
    const l = new Line2D();
    chai.expect(l.x1).to.equal(0);
    chai.expect(l.y1).to.equal(0);
    chai.expect(l.x2).to.equal(0);
    chai.expect(l.y2).to.equal(0);
  });

  it('should make a line from an object with x1,y1,x2,y2 properties', () => {
    const l = new Line2D({x1:1, y1:2, x2: 3, y2: 4});
    chai.expect(l.x1).to.equal(1);
    chai.expect(l.y1).to.equal(2);
    chai.expect(l.x2).to.equal(3);
    chai.expect(l.y2).to.equal(4);
  });

  it('should make a line from two vectors', () => {
    const l = new Line2D(new Vector2D(1,2), new Vector2D(3,4));
    chai.expect(l.x1).to.equal(1);
    chai.expect(l.y1).to.equal(2);
    chai.expect(l.x2).to.equal(3);
    chai.expect(l.y2).to.equal(4);
  });

  it('should make a line from 4 numbers', () => {
    const l = new Line2D(1,2,3,4);
    chai.expect(l.x1).to.equal(1);
    chai.expect(l.y1).to.equal(2);
    chai.expect(l.x2).to.equal(3);
    chai.expect(l.y2).to.equal(4);
  });

  it('should support start/end accessors', () => {
    const l = new Line2D(1,2,3,4);
    chai.expect(l.start.x).to.equal(1);
    chai.expect(l.start.y).to.equal(2);
    chai.expect(l.end.x).to.equal(3);
    chai.expect(l.end.y).to.equal(4);
  });

  it('should support clone', () => {
    const a = new Line2D(1,2,3,4);
    const l = a.clone();
    chai.expect(l.start.x).to.equal(1);
    chai.expect(l.start.y).to.equal(2);
    chai.expect(l.end.x).to.equal(3);
    chai.expect(l.end.y).to.equal(4);
  });

  it('should support toObject/fromObject', () => {
    const a = new Line2D(1,2,3,4);
    let o = a.toObject();
    let l = Line2D.fromObject(o);
    chai.expect(l.start.x).to.equal(1);
    chai.expect(l.start.y).to.equal(2);
    chai.expect(l.end.x).to.equal(3);
    chai.expect(l.end.y).to.equal(4);
  });

  it('should be able to calculate its length', () => {
    const a = new Line2D(0,0,3,4);
    chai.expect(a.len()).to.equal(5);
  });

  it('should be able to calculate its slope', () => {
    const a = new Line2D(0,0,100,100);
    chai.expect(a.slope()).to.equal(1);
  });

  // TODO FIX ME
  // it('should be able to calculate distance of point to line', () => {
  //   const a = new Line2D(0,0,100,0);
  //   const d = a.distanceToSegment(new Vector2D(50,50));
  //   chai.expect(a.distanceToSegment(d)).to.equal(50);
  // });
  //
  it('should be able to calculate point on line', () => {
    const a = new Line2D(0,0,100,100);
    let p = a.pointOnLine(0.5)
    chai.expect(p.x).to.equal(50);
    chai.expect(p.y).to.equal(50);
  });

});

import Vector2D from '../../src/containers/graphics/geometry/vector2d';
import {nearly} from '../../src/containers/graphics/utils';
import chai from 'chai';

describe('Vector2D', () => {

  it('should make an empty', () => {
    const vector = new Vector2D();
    chai.expect(vector.x).to.equal(0);
    chai.expect(vector.y).to.equal(0);
  });

  it('should make vector with the given values', () => {
    const vector = new Vector2D(1,2);
    chai.expect(vector.x).to.equal(1);
    chai.expect(vector.y).to.equal(2);
  });

  it('should serialize the vector to a string', () => {
    const vector = new Vector2D(1,2);
    const s = vector.toObject();
    chai.expect(s).to.equal('1,2');
  });

  it('should deserialize the vector', () => {
    const vector = new Vector2D(1,2);
    const s = vector.toObject();
    const other = Vector2D.fromObject(s);
    chai.expect(vector.x).to.equal(other.x);
    chai.expect(vector.y).to.equal(other.y);
  });

  it('should format as a pretty string', () => {
    chai.expect(new Vector2D(3,4).toString()).to.equal('v2d(3, 4)');
  });

  it('should clone the vector', () => {
    let v1 = new Vector2D(7,8);
    let v2 = v1.clone();
    chai.expect(v1.x).to.equal(v2.x);
    chai.expect(v1.y).to.equal(v2.y);
  });

  it('should snap the vector to an integer scalar', () => {
    let v1 = new Vector2D(13.1415, 22766.123);
    let v2 = v1.snap(10);
    chai.expect(v2.x).to.equal(10);
    chai.expect(v2.y).to.equal(22760);
  });

  it('should find a point on the circumference of a circle', () => {
    let v1 = Vector2D.pointOnCircumference(100,100,100,270);
    chai.expect(nearly(v1.x, 100)).to.be.true;
    chai.expect(nearly(v1.y, 0)).to.be.true;
  });

  it('should calculate the angle between two vectors (points)', () => {
    let v1 = new Vector2D(0,0);
    let v2 = new Vector2D(100,100);
    let a = v1.angleBetween(v2);
    chai.expect(nearly(a, 45)).to.be.true;
  });

  it('should be able to add vectors', () => {
    let v1 = new Vector2D(3,4);
    let v2 = new Vector2D(300, 400);
    let v3 = v1.add(v2);
    chai.expect(v3.x).to.equal(303);
    chai.expect(v3.y).to.equal(404);
  });

  it('should be able to substract vectors', () => {
    let v1 = new Vector2D(3,4);
    let v2 = new Vector2D(300, 400);
    let v3 = v1.sub(v2);
    chai.expect(v3.x).to.equal(-297);
    chai.expect(v3.y).to.equal(-396);
  });

  it('should be able multiply a vector', () => {
    let v1 = new Vector2D(3,4);
    let v2 = v1.multiply(10);
    chai.expect(v2.x).to.equal(30);
    chai.expect(v2.y).to.equal(40);
  });

  it('should be able divide a vector', () => {
    let v1 = new Vector2D(100,200);
    let v2 = v1.divide(10);
    chai.expect(v2.x).to.equal(10);
    chai.expect(v2.y).to.equal(20);
  });

  it('should be able to find the length of a vector', () => {
    let v1 = new Vector2D(3, 4);
    let l = v1.len();
    chai.expect(l).to.equal(5);
  });

  it('should be able to find the distance between two points', () => {
    let v1 = new Vector2D(0,0);
    let v2 = new Vector2D(300,400);
    let d = v1.distance(v2);
    chai.expect(d).to.equal(500);
  });

  it('should be able to find the dot product of two vectors', () => {
    let v1 = new Vector2D(100, 0);
    let v2 = new Vector2D(50, 0);
    let d = v1.dot(v2);
    chai.expect(d).to.equal(5000);
  });

  it('should be able to test for similarity', () => {
    let v1 = new Vector2D(100, 200);
    let v2 = new Vector2D(100.000000007, 199.999999999);
    let s = v1.similar(v2);
    chai.expect(s).to.be.true;
  });

  it('should be able to do aspect ratio calculations', () => {
    let v1 = Vector2D.scaleToWindow(100,100, 50, 50, false);
    chai.expect(v1.x).to.equal(50);
    chai.expect(v1.y).to.equal(50);
  });

});
